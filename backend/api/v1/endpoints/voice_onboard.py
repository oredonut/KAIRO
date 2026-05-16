"""
app/api/v1/endpoints/voice_onboard.py

Two endpoints:
1. POST /voice/onboard  — receives audio for each onboarding step,
                          returns transcript + extracted value
2. POST /voice/synthesise — converts text to speech (ElevenLabs or browser fallback)
"""

import os
import re
import tempfile
import asyncio
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from loguru import logger

from app.core.config import settings

router = APIRouter(prefix="/voice", tags=["Voice onboarding"])

# ── Language to voice ID mapping (ElevenLabs) ─────────────────
VOICE_IDS = {
    "en":  "21m00Tcm4TlvDq8ikWAM",   # English (Rachel)
    "pcm": "21m00Tcm4TlvDq8ikWAM",   # Pidgin — use English voice
    "yo":  "21m00Tcm4TlvDq8ikWAM",   # Yoruba — translate then speak
    "ig":  "21m00Tcm4TlvDq8ikWAM",   # Igbo
    "ha":  "21m00Tcm4TlvDq8ikWAM",   # Hausa
}

# ── Onboarding step definitions ────────────────────────────────
# Maps step number → what to extract from the transcript
STEP_EXTRACTORS = {
    0: "name",
    1: "phone",
    2: "user_type",
    3: "language",
    4: "kyc_intent",    # "yes", "uploading", etc.
    5: "skills",
    6: "wallet_intent", # "yes", "create", etc.
    7: "complete",
}


# ── Main onboarding voice endpoint ────────────────────────────

@router.post("/onboard")
async def voice_onboard_step(
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
    onboarding_step: int = Form(default=0),
):
    """
    Receives audio for one onboarding step.
    Returns:
    - transcript: what the user said
    - extracted_value: the clean value to store (name, phone, etc.)
    - detected_language: language code if different from input
    - next_step_ready: whether to advance
    """
    audio_bytes = await audio.read()
    if len(audio_bytes) > 10 * 1024 * 1024:
        raise HTTPException(413, "Audio too large — max 10MB")

    # Step 1 — Transcribe with Whisper
    transcript = await _transcribe(audio_bytes)
    if not transcript.strip():
        return {
            "transcript": "",
            "extracted_value": None,
            "detected_language": language,
            "next_step_ready": False,
            "error": "Could not understand audio",
        }

    logger.info(f"Onboarding step {onboarding_step} | transcript: {transcript[:80]}")

    # Step 2 — Detect language shift
    detected_lang = _detect_language(transcript, language)

    # Step 3 — Extract the value for this step
    field     = STEP_EXTRACTORS.get(onboarding_step, "general")
    extracted = _extract_field(field, transcript, detected_lang)

    return {
        "transcript":        transcript,
        "extracted_value":   extracted,
        "detected_language": detected_lang,
        "next_step_ready":   extracted is not None,
        "field":             field,
    }


# ── Text-to-speech endpoint ────────────────────────────────────

@router.post("/synthesise")
async def synthesise_speech(
    text: str,
    language: str = "en",
):
    """
    Converts a string to speech using ElevenLabs.
    Returns audio/mpeg bytes.
    Falls back gracefully if API key is missing.
    """
    if not settings.ELEVENLABS_API_KEY:
        # Return empty 200 — frontend falls back to browser TTS
        return Response(content=b"", media_type="audio/mpeg")

    # Translate if not English
    if language not in ("en", "pcm"):
        text = await _translate(text, language)

    voice_id   = VOICE_IDS.get(language, VOICE_IDS["en"])
    audio_data = await _elevenlabs_tts(text, voice_id)

    if audio_data:
        return Response(content=audio_data, media_type="audio/mpeg")

    return Response(content=b"", media_type="audio/mpeg")


# ── Whisper transcription ──────────────────────────────────────

async def _transcribe(audio_bytes: bytes) -> str:
    """
    Runs Whisper in a thread pool so it doesn't block the event loop.
    """
    loop = asyncio.get_event_loop()

    def _run():
        import whisper
        model = _get_whisper_model()
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_bytes)
            path = f.name
        try:
            result = model.transcribe(path, task="transcribe")
            return result.get("text", "").strip()
        finally:
            try:
                os.unlink(path)
            except OSError:
                pass

    try:
        return await loop.run_in_executor(None, _run)
    except Exception as e:
        logger.error(f"Whisper transcription error: {e}")
        return ""


# Lazy-load Whisper once
_whisper_model_cache = None

def _get_whisper_model():
    global _whisper_model_cache
    if _whisper_model_cache is None:
        import whisper
        logger.info("Loading Whisper base model...")
        _whisper_model_cache = whisper.load_model("base")
    return _whisper_model_cache


# ── Language detection ─────────────────────────────────────────

def _detect_language(transcript: str, default_lang: str) -> str:
    """
    Check if the user switched language mid-session.
    Simple keyword detection — replace with langdetect in production.
    """
    t = transcript.lower()

    # Explicit language requests
    if any(w in t for w in ["speak english", "english please", "use english"]):
        return "en"
    if any(w in t for w in ["pidgin", "speak pidgin", "naija"]):
        return "pcm"
    if any(w in t for w in ["yoruba", "ede yoruba"]):
        return "yo"
    if any(w in t for w in ["igbo", "ibo language"]):
        return "ig"
    if any(w in t for w in ["hausa", "harshen hausa"]):
        return "ha"

    # Yoruba keywords
    if any(w in t for w in ["ẹ káàbọ̀", "dára", "jọwọ", "mo", "ẹ jẹ́"]):
        return "yo"
    # Igbo keywords
    if any(w in t for w in ["nnọọ", "dị mma", "biko", "ka anyị"]):
        return "ig"
    # Hausa keywords
    if any(w in t for w in ["barka", "yauwa", "don allah", "mene"]):
        return "ha"
    # Pidgin keywords
    if any(w in t for w in ["wetin", "abeg", "na im", "oya", "dey"]):
        return "pcm"

    # Try langdetect if available
    try:
        from langdetect import detect
        detected = detect(transcript)
        lang_map = {"yo": "yo", "ig": "ig", "ha": "ha"}
        return lang_map.get(detected, default_lang)
    except Exception:
        return default_lang


# ── Field extraction from transcript ──────────────────────────

def _extract_field(field: str, transcript: str, language: str) -> Optional[str]:
    """
    Extracts a specific data field from the transcript.
    Returns the clean value or None if not found.
    """
    t = transcript.strip()

    if field == "name":
        # Remove filler words
        name = re.sub(
            r"^(my name is|i am|i'm|call me|na me be|emi ni)\s*",
            "", t, flags=re.IGNORECASE
        ).strip()
        # Must be at least 2 words
        if len(name.split()) >= 2:
            return name.title()
        return None

    if field == "phone":
        # Extract digits
        digits = re.findall(r"[\d]{10,}", t.replace(" ", ""))
        if digits:
            num = digits[0]
            return f"+234{num[-10:]}" if not num.startswith("+") else num
        # Also try spoken form: "zero eight zero one..."
        word_to_digit = {
            "zero":"0","one":"1","two":"2","three":"3","four":"4",
            "five":"5","six":"6","seven":"7","eight":"8","nine":"9",
        }
        words  = t.lower().split()
        number = "".join(word_to_digit.get(w, "") for w in words)
        if len(number) >= 10:
            return f"+234{number[-10:]}"
        return None

    if field == "user_type":
        t_lower = t.lower()
        if any(w in t_lower for w in ["trader","artisan","oniṣòwò","onye azụmaahịa","ɗan kasuwa","trade"]):
            return "worker"
        if any(w in t_lower for w in ["job seeker","job","work","employment","ẹni tó ń wá iṣẹ́","onye na-achọ"]):
            return "worker"
        if any(w in t_lower for w in ["business","small business","iṣòwò","ụlọ ọrụ","kasuwanci"]):
            return "worker"
        if any(w in t_lower for w in ["employer","hire","olùṣiṣẹ́","onye nnọchi","mai aiki"]):
            return "employer"
        return None

    if field == "language":
        t_lower = t.lower()
        if any(w in t_lower for w in ["english","inglés"]):
            return "en"
        if any(w in t_lower for w in ["pidgin","naija","broken"]):
            return "pcm"
        if any(w in t_lower for w in ["yoruba","yorùbá"]):
            return "yo"
        if any(w in t_lower for w in ["igbo","ibo"]):
            return "ig"
        if any(w in t_lower for w in ["hausa","hause"]):
            return "ha"
        return "en"  # default

    if field == "kyc_intent":
        t_lower = t.lower()
        if any(w in t_lower for w in ["yes","okay","ok","sure","upload","done","alright","yep","yeah"]):
            return "confirmed"
        if any(w in t_lower for w in ["no","skip","later","not now"]):
            return "skipped"
        return "confirmed"  # assume yes

    if field == "skills":
        t_lower = t.lower()
        found = []
        skill_map = {
            "tailor": ["tailor","sew","fashion","clothing"],
            "mechanic": ["mechanic","repair","engine","car"],
            "food_vendor": ["food","cook","vendor","sell food","chef"],
            "pos_operator": ["pos","point of sale","banking agent"],
            "carpenter": ["carpenter","wood","furniture","build"],
            "driver": ["driver","drive","transport","okada","uber"],
            "trader": ["trader","trade","market","buy and sell"],
        }
        for skill, keywords in skill_map.items():
            if any(kw in t_lower for kw in keywords):
                found.append(skill)
        return ",".join(found) if found else None

    if field == "wallet_intent":
        t_lower = t.lower()
        if any(w in t_lower for w in ["yes","create","yes create","sure","okay","ok","go ahead"]):
            return "create"
        if any(w in t_lower for w in ["no","skip","later","not now"]):
            return "skip"
        return "create"  # default yes

    if field == "complete":
        return "done"

    # General — just return cleaned transcript
    return t if len(t) > 2 else None


# ── ElevenLabs TTS ─────────────────────────────────────────────

async def _elevenlabs_tts(text: str, voice_id: str) -> Optional[bytes]:
    import httpx
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            resp = await c.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": settings.ELEVENLABS_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": "eleven_monolingual_v1",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                    },
                },
            )
        if resp.status_code == 200:
            return resp.content
        logger.warning(f"ElevenLabs error {resp.status_code}: {resp.text[:200]}")
        return None
    except Exception as e:
        logger.error(f"ElevenLabs TTS failed: {e}")
        return None


# ── Translation (for non-English TTS) ─────────────────────────

async def _translate(text: str, target_lang: str) -> str:
    """Translate English text to target language for TTS."""
    lang_map = {
        "yo": "yoruba",
        "ig": "igbo",
        "ha": "hausa",
        "pcm": None,   # Pidgin — no good translation engine, use English
    }
    target = lang_map.get(target_lang)
    if not target:
        return text
    try:
        from deep_translator import GoogleTranslator
        return GoogleTranslator(source="en", target=target).translate(text)
    except Exception as e:
        logger.warning(f"Translation failed: {e}")
        return text 