import asyncio
import base64
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.security import get_current_user_id
from app.models.models import VoiceJournal, User, EconomicIdentity, Wallet
from app.schemas.schemas import VoiceQueryResponse, VoiceJournalResponse, ChatRequest
from app.services.voice.voice_service import (
    transcribe_audio, extract_voice_intent,
    extract_signals_from_transcript, synthesise_speech,
)
from app.services.ai.chat_service import chat_with_advisor

router = APIRouter(prefix="/voice", tags=["Voice AI"])


# ── Voice query (search, balance check, etc.) ──────────────────

@router.post("/query", response_model=VoiceQueryResponse)
async def voice_query(
    audio: UploadFile = File(...),
    language: str = "en",
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Full voice pipeline:
    1. Whisper STT → transcript
    2. Detect language + extract intent
    3. Route to correct action or Claude chat
    4. ElevenLabs TTS → audio response
    """
    audio_bytes = await audio.read()
    if len(audio_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(413, "Audio file too large (max 10MB)")

    # Step 1 — Transcribe
    transcription = await transcribe_audio(audio_bytes, audio.filename)
    transcript    = transcription["transcript"]
    lang_detected = transcription["language_detected"]

    # Step 2 — Extract intent
    intent_data = extract_voice_intent(transcript)
    intent      = intent_data["intent"]
    action      = intent_data["action"]

    # Step 3 — Build context + get response text
    response_text = await _handle_intent(intent, action, user_id, transcript, lang_detected, db)

    # Step 4 — Synthesize speech (non-blocking)
    audio_b64 = None
    audio_bytes_out = await synthesise_speech(response_text, lang_detected)
    if audio_bytes_out:
        audio_b64 = base64.b64encode(audio_bytes_out).decode()

    return VoiceQueryResponse(
        transcript=transcript,
        language_detected=lang_detected,
        intent=intent,
        response_text=response_text,
        audio_url=audio_b64,  # base64 — frontend decodes and plays
        action=intent_data,
    )


async def _handle_intent(
    intent: str,
    action: str,
    user_id: str,
    transcript: str,
    language: str,
    db: AsyncSession,
) -> str:
    """Route the detected intent to the right handler."""

    if action == "return_balance":
        wallet_result = await db.execute(
            select(Wallet).where(Wallet.user_id == user_id)
        )
        wallet = wallet_result.scalar_one_or_none()
        balance = wallet.balance if wallet else 0
        return f"Your wallet balance is ₦{balance:,.0f}."

    if action == "return_score":
        ident_result = await db.execute(
            select(EconomicIdentity).where(EconomicIdentity.user_id == user_id)
        )
        ident = ident_result.scalar_one_or_none()
        score = ident.trust_score if ident else 0
        return f"Your Trust Score is {score:.0f} out of 100."

    if action in ("navigate_opportunities", "navigate_loans", "send_to_chat"):
        # Fall through to Claude for natural language response
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        ident_result = await db.execute(
            select(EconomicIdentity).where(EconomicIdentity.user_id == user_id)
        )
        ident = ident_result.scalar_one_or_none()
        wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
        wallet = wallet_result.scalar_one_or_none()

        context = {
            "full_name":    user.full_name if user else "User",
            "work_category": user.work_category if user else "",
            "location":     user.location if user else "",
            "trust_score":  ident.trust_score if ident else 0,
            "growth_score": ident.growth_score if ident else 0,
            "credit_confidence": ident.credit_confidence if ident else 0,
            "balance":      wallet.balance if wallet else 0,
            "weekly_earnings": wallet.weekly_earnings if wallet else 0,
            "total_gigs":   ident.total_gigs if ident else 0,
            "repayment_rate": ident.repayment_rate if ident else 100,
            "language":     language,
        }
        result = await chat_with_advisor(transcript, context, language=language)
        return result["reply"]

    return "I heard you. How can I help you further?"


# ── Voice journal ──────────────────────────────────────────────

@router.post("/journal", response_model=VoiceJournalResponse, status_code=201)
async def save_voice_journal(
    audio: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    User speaks about their workday.
    AI extracts income, gigs, skills and trust signals.
    """
    audio_bytes = await audio.read()
    transcription = await transcribe_audio(audio_bytes, audio.filename)
    transcript    = transcription["transcript"]
    lang_detected = transcription["language_detected"]

    signals = extract_signals_from_transcript(transcript)

    entry = VoiceJournal(
        user_id=user_id,
        transcript=transcript,
        language_detected=lang_detected,
        ai_extracted=signals,
        trust_score_impact=signals["trust_score_impact"],
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    # Fire n8n to update trust score from journal signals
    from app.services.automation.n8n_service import on_voice_journal_saved
    asyncio.create_task(on_voice_journal_saved(user_id, str(entry.id)))

    return VoiceJournalResponse.model_validate(entry)


@router.get("/journal", response_model=list[VoiceJournalResponse])
async def list_journals(
    limit: int = 10,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VoiceJournal)
        .where(VoiceJournal.user_id == user_id)
        .order_by(VoiceJournal.created_at.desc())
        .limit(limit)
    )
    return [VoiceJournalResponse.model_validate(j) for j in result.scalars().all()]
    print("test")