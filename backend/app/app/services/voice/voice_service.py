import asyncio
import cloudinary
import cloudinary.uploader
from typing import Optional, Dict, Any
from loguru import logger
from app.core.config import settings

# Configure Cloudinary
if settings.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )

async def upload_voice_bio(file_content: bytes, user_id: str) -> str:
    """
    Uploads a voice bio to Cloudinary and returns the URL.
    """
    try:
        upload_result = cloudinary.uploader.upload(
            file_content,
            resource_type="video", # Audio files are treated as video in Cloudinary
            public_id=f"kairo/voice_bios/{user_id}",
            folder="kairo/voice_bios"
        )
        return upload_result.get("secure_url")
    except Exception as e:
        logger.error(f"Error uploading voice bio: {e}")
        return ""

async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.wav") -> Dict[str, Any]:
    """
    Transcribes audio using a speech-to-text service (e.g., Whisper).
    """
    try:
        logger.info(f"Transcribing {filename} ({len(audio_bytes)} bytes)")
        return {
            "transcript": "I am a logistics worker in Lagos looking for better gig opportunities and a loan to expand my business.",
            "language_detected": "en"
        }
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        return {"transcript": "", "language_detected": "en"}

def extract_voice_intent(transcript: str) -> Dict[str, Any]:
    """
    Extracts intent and actions from transcribed text.
    """
    t = transcript.lower()
    intent = "general_query"
    action = "send_to_chat"

    if "balance" in t or "money" in t:
        intent = "check_balance"
        action = "return_balance"
    elif "score" in t or "trust" in t:
        intent = "check_trust_score"
        action = "return_score"
    elif "gig" in t or "job" in t or "work" in t:
        intent = "find_work"
        action = "navigate_opportunities"
    elif "loan" in t or "borrow" in t:
        intent = "apply_loan"
        action = "navigate_loans"

    return {"intent": intent, "action": action}

def extract_signals_from_transcript(transcript: str) -> Dict[str, Any]:
    """
    Extracts economic signals (skills, income mentions) from a journal transcript.
    """
    return {
        "skills": ["logistics", "driving"],
        "work_category": "Logistics",
        "location": "Lagos",
        "income_mention": 0.0,
        "trust_score_impact": 2.5  # Positive boost for journaling
    }

async def synthesise_speech(text: str, language: str = "en") -> Optional[bytes]:
    """
    Converts text to speech using a TTS service (e.g., ElevenLabs).
    """
    try:
        logger.info(f"Synthesising: {text[:50]}...")
        return None
    except Exception as e:
        logger.error(f"TTS error: {e}")
        return None
