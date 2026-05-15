import asyncio
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger

from app.db.database import get_db
from app.models.models import User, Wallet, Transaction
from app.services.squad.squad_service import verify_squad_webhook
from app.services.automation.n8n_service import on_payment_received
from app.services.ai.trust_scoring import generate_tx_insight

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/squad")
async def squad_webhook(request: Request):
    """
    Squad fires this endpoint for EVERY payment event.
    Must respond within 5 seconds or Squad will retry.
    All heavy work is handed off to n8n via create_task.
    """
    body = await request.body()

    # 1. Verify HMAC signature — reject anything not from Squad
    sig = request.headers.get("x-squad-encrypted-body", "")
    if not verify_squad_webhook(body, sig):
        logger.warning("Squad webhook: invalid signature")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = await request.json()
    event   = payload.get("Event", "")
    data    = payload.get("Body", {})

    logger.info(f"Squad webhook received: {event}")

    # Use a fresh DB session for background processing
    async with AsyncSession() as db:

        # ── Incoming payment ──────────────────────────────────
        if event == "charge.success":
            customer_id = data.get("customer_id", "")
            amount_kobo = data.get("amount", 0)
            amount_naira = amount_kobo / 100
            reference = data.get("transaction_ref", "")

            # Find user by squad_customer_id
            user_result = await db.execute(
                select(User).where(User.squad_customer_id == customer_id)
            )
            user = user_result.scalar_one_or_none()

            if user:
                # Credit wallet
                wallet_result = await db.execute(
                    select(Wallet).where(Wallet.user_id == user.id)
                )
                wallet = wallet_result.scalar_one_or_none()
                if wallet:
                    wallet.balance         += amount_naira
                    wallet.weekly_earnings += amount_naira
                    wallet.monthly_volume  += amount_naira

                # Write transaction record
                tx = Transaction(
                    user_id=user.id,
                    type="credit",
                    category="payment",
                    amount=amount_naira,
                    balance_after=wallet.balance if wallet else amount_naira,
                    description=data.get("transaction_indicator", "Payment received"),
                    reference=reference,
                    squad_ref=reference,
                    status="success",
                    ai_insight=generate_tx_insight("credit", amount_naira, "payment"),
                )
                db.add(tx)
                await db.commit()

                # Fire n8n — trust scoring + WhatsApp notification
                asyncio.create_task(on_payment_received(
                    user_id=str(user.id),
                    amount=amount_naira,
                    reference=reference,
                    squad_customer_id=customer_id,
                ))

        # ── Outgoing transfer confirmed ───────────────────────
        elif event == "transfer.success":
            reference = data.get("transaction_reference", "")
            tx_result = await db.execute(
                select(Transaction).where(Transaction.reference == reference)
            )
            tx = tx_result.scalar_one_or_none()
            if tx:
                tx.status = "success"
                await db.commit()
                logger.info(f"Transfer confirmed: {reference}")

        # ── Transfer failed — reverse the debit ───────────────
        elif event == "transfer.failed":
            reference = data.get("transaction_reference", "")
            tx_result = await db.execute(
                select(Transaction).where(Transaction.reference == reference)
            )
            tx = tx_result.scalar_one_or_none()
            if tx:
                tx.status = "failed"
                # Reverse the optimistic debit
                wallet_result = await db.execute(
                    select(Wallet).where(Wallet.user_id == tx.user_id)
                )
                wallet = wallet_result.scalar_one_or_none()
                if wallet:
                    wallet.balance         += tx.amount
                    wallet.monthly_volume  -= tx.amount
                await db.commit()
                logger.warning(f"Transfer failed + reversed: {reference}")

    # Must return 200 fast — Squad retries on any non-2xx or timeout
    return {"status": "ok"}