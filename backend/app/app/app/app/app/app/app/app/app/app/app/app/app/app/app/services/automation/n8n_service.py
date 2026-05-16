import httpx
from loguru import logger
from app.core.config import settings

async def trigger_n8n(event_name: str, payload: dict):
    """
    Sends a webhook to n8n to trigger an automation workflow.
    """
    if not settings.N8N_BASE_URL:
        logger.warning("N8N_BASE_URL not configured. Skipping trigger.")
        return

    # Typical n8n webhook URL structure
    url = f"{settings.N8N_BASE_URL}/webhook/kairo-events"
    
    headers = {
        "X-N8N-Token": settings.N8N_WEBHOOK_TOKEN,
        "Content-Type": "application/json"
    }
    
    data = {
        "event": event_name,
        "data": payload
    }
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=data, headers=headers)
            resp.raise_for_status()
            logger.info(f"N8N trigger successful: {event_name}")
    except Exception as e:
        logger.error(f"Failed to trigger N8N event {event_name}: {str(e)}")

async def on_kyc_submitted(user_id: str, id_image_url: str, selfie_url: str, id_type: str):
    """Specific trigger for KYC submission."""
    await trigger_n8n("kyc-submitted", {
        "user_id": user_id,
        "id_image_url": id_image_url,
        "selfie_url": selfie_url,
        "id_type": id_type
    })

async def on_wallet_created(user_id: str, account_number: str):
    """Specific trigger for wallet creation."""
    await trigger_n8n("wallet-created", {
        "user_id": user_id,
        "account_number": account_number
    })

async def on_payment_received(user_id: str, amount: float, reference: str):
    """Specific trigger for incoming payments."""
    await trigger_n8n("payment-received", {
        "user_id": user_id,
        "amount": amount,
        "reference": reference
    })

async def on_loan_applied(user_id: str, amount: float, loan_id: str):
    """Specific trigger for loan application."""
    await trigger_n8n("loan-applied", {
        "user_id": user_id,
        "amount": amount,
        "loan_id": loan_id
    })

async def on_fraud_flagged(user_id: str, transaction_id: str, score: float, severity: str):
    """Specific trigger for fraud alerts."""
    await trigger_n8n("fraud-flagged", {
        "user_id": user_id,
        "transaction_id": transaction_id,
        "score": score,
        "severity": severity
    })

async def on_user_registered(user_id: str, full_name: str, phone: str):
    """Specific trigger for user registration."""
    await trigger_n8n("user-registered", {
        "user_id": user_id,
        "full_name": full_name,
        "phone": phone
    })

async def on_voice_journal_saved(user_id: str, journal_id: str):
    """Specific trigger for voice journal processing."""
    await trigger_n8n("voice-journal-saved", {
        "user_id": user_id,
        "journal_id": journal_id
    })
