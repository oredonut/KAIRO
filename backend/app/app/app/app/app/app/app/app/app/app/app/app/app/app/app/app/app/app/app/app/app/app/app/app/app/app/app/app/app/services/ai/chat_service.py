import uuid
import json
from typing import Optional
from loguru import logger
import httpx

from app.core.config import settings
from app.db.redis_client import cache_get, cache_set


# ── System prompt builder ──────────────────────────────────────

def build_system_prompt(user_context: dict) -> str:
    return f"""You are KAIRO Advisor — an embedded AI economic coach inside KAIRO, a fintech platform for informal workers across Africa.

You have real-time access to this user's economic profile:
- Name: {user_context.get('full_name', 'User')}
- Work Category: {user_context.get('work_category', 'Not set')}
- Location: {user_context.get('location', 'Nigeria')}
- Trust Score: {user_context.get('trust_score', 0)}/100
- Growth Score: {user_context.get('growth_score', 0)}/100
- Wallet Balance: ₦{user_context.get('balance', 0):,.0f}
- Weekly Earnings: ₦{user_context.get('weekly_earnings', 0):,.0f}
- Gigs Completed: {user_context.get('total_gigs', 0)}
- Repayment Rate: {user_context.get('repayment_rate', 100)}%
- Credit Confidence: {user_context.get('credit_confidence', 0)}/100
- Language: {user_context.get('language', 'English')}

Your role:
1. Give HIGHLY personalised advice based on their ACTUAL numbers above — never give generic answers
2. Explain trust score changes using their specific transaction patterns
3. Surface loans, gigs and opportunities they actually qualify for
4. Coach on savings, income growth, and financial decisions
5. Be warm, encouraging, and aware of Nigerian/African informal economy realities
6. Keep responses concise — 3 to 5 sentences max unless asked for detail
7. Always end with ONE concrete action they can take inside KAIRO right now
8. Use ₦ for currency. Reference their real scores naturally.
9. If they write in Pidgin, Yoruba, Igbo or Hausa — reply in the SAME language
10. Never be generic. This user's data is right above you — use it.

You are NOT a chatbot. You are this person's personal economic coach who knows their data intimately."""


# ── Session history from Redis ─────────────────────────────────

async def get_session_history(session_id: str) -> list:
    cached = await cache_get(f"chat_session:{session_id}")
    return json.loads(cached) if cached else []


async def save_session_history(session_id: str, messages: list):
    # Keep last 10 messages only to stay within context window
    trimmed = messages[-10:]
    await cache_set(f"chat_session:{session_id}", json.dumps(trimmed), ttl=1800)


# ── Convert stored history to Gemini format ────────────────────

def _to_gemini_history(history: list) -> list:
    """
    Stored history format: [{"role": "user"|"assistant", "content": "..."}]
    Gemini format:         [{"role": "user"|"model",     "parts": ["..."]}]
    """
    gemini_history = []
    for msg in history:
        role = "model" if msg["role"] == "assistant" else "user"
        gemini_history.append({"role": role, "parts": [msg["content"]]})
    return gemini_history


# ── Main chat function ─────────────────────────────────────────

async def chat_with_advisor(
    user_message: str,
    user_context: dict,
    session_id: Optional[str] = None,
    language: str = "en",
) -> dict:
    """
    Sends a message to Vapi Chat API with full user economic context injected.
    Maintains conversation history per session by tracking Vapi's chat ID in Redis.
    """
    if not session_id:
        session_id = str(uuid.uuid4())

    # Load history (specifically the Vapi previousChatId)
    vapi_chat_id = None
    cached = await cache_get(f"vapi_session:{session_id}")
    if cached:
        vapi_chat_id = cached.decode("utf-8") if isinstance(cached, bytes) else cached

    reply = "I'm having a connection issue right now. Please try again."
    
    try:
        # Prepare Vapi Chat API Payload
        payload = {
            "assistantId": settings.VAPI_ASSISTANT_ID,
            "input": user_message,
            "assistant": {
                "model": {
                    "messages": [
                        {
                            "role": "system",
                            "content": build_system_prompt(user_context)
                        }
                    ]
                }
            }
        }
        
        if vapi_chat_id:
            payload["previousChatId"] = vapi_chat_id

        headers = {
            "Authorization": f"Bearer {settings.VAPI_PRIVATE_KEY}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.vapi.ai/chat",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            res.raise_for_status()
            chat_data = res.json()
            
            # Vapi returns the response in output[0].content
            if "output" in chat_data and len(chat_data["output"]) > 0:
                reply = chat_data["output"][0]["content"]
            
            # Save the new Vapi Chat ID to maintain session
            new_chat_id = chat_data.get("id")
            if new_chat_id:
                await cache_set(f"vapi_session:{session_id}", new_chat_id, ttl=1800)

    except Exception as e:
        logger.error(f"Vapi Chat API error: {e}")
        # Graceful fallback — still useful without API
        trust = user_context.get('trust_score', 0)
        name  = user_context.get('full_name', 'there')
        reply = (
            f"Hey {name.split()[0]}! I'm having a connection issue right now. "
            f"Your Trust Score is {trust}/100 and your wallet is active. "
            f"Head to the Opportunities tab to see your matched gigs."
        )

    # Generate context-aware follow-up suggestions
    suggestions = _generate_suggestions(user_message, reply, user_context)

    return {
        "reply": reply,
        "suggestions": suggestions,
        "session_id": session_id,
        "action": _detect_action(reply),
    }


# ── Suggestion chips ───────────────────────────────────────────

def _generate_suggestions(user_msg: str, reply: str, ctx: dict) -> list:
    msg_lower = (user_msg + reply).lower()
    if "score" in msg_lower or "trust" in msg_lower:
        return ["How do I improve faster?", "What hurt my score?", "Set a score goal"]
    if "loan" in msg_lower or "borrow" in msg_lower:
        return ["Apply for loan now", "Check my eligibility", "Repayment schedule"]
    if "gig" in msg_lower or "job" in msg_lower or "work" in msg_lower:
        return ["Show gigs near me", "Filter by payout", "Top matches today"]
    if "balance" in msg_lower or "wallet" in msg_lower or "money" in msg_lower:
        return ["View transactions", "Send money", "Top up savings"]
    return ["What should I do next?", "Show opportunities", "Check my score"]


# ── Intent-to-action mapper ────────────────────────────────────

def _detect_action(reply: str) -> Optional[dict]:
    """
    If Gemini's reply suggests navigating somewhere in the app,
    return an action object the frontend can handle.
    """
    reply_lower = reply.lower()
    if "opportunities tab" in reply_lower or "gigs" in reply_lower:
        return {"navigate": "/opportunities"}
    if "wallet" in reply_lower and "head to" in reply_lower:
        return {"navigate": "/wallet"}
    if "insights" in reply_lower:
        return {"navigate": "/insights"}
    return None