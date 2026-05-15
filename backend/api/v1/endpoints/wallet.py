import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.security import get_current_user_id
from app.models.models import User, Wallet, Transaction
from app.schemas.schemas import (
    WalletResponse, CreateWalletResponse,
    SendTransferRequest, VerifyReceiverRequest, VerifyReceiverResponse,
    TransactionListResponse, TransactionResponse,
)
from app.services.squad import squad_service
from app.services.automation.n8n_service import on_payment_received
from app.services.ai.fraud_detection import check_transaction_anomaly
from app.services.ai.trust_scoring import generate_tx_insight

router = APIRouter(prefix="/wallet", tags=["Wallet"])


# ── Create wallet ──────────────────────────────────────────────

@router.post("/create", response_model=CreateWalletResponse)
async def create_wallet(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    if user.squad_customer_id:
        raise HTTPException(409, "Wallet already exists")

    data = await squad_service.create_wallet(
        user_id=str(user.id),
        full_name=user.full_name,
        phone=user.phone,
        email=user.email or f"{str(user.id)[:8]}@kairo.ng",
        bvn=user.bvn,
    )

    # Persist to user record
    user.squad_customer_id   = data["squad_customer_id"]
    user.virtual_account_no  = data["virtual_account_no"]
    user.virtual_account_bank= data["virtual_account_bank"]

    wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    wallet = wallet_result.scalar_one_or_none()
    if wallet:
        wallet.status = "active"

    await db.commit()

    # Fire n8n welcome workflow
    from app.services.automation.n8n_service import on_wallet_created
    asyncio.create_task(on_wallet_created(str(user.id), data["virtual_account_no"]))

    return CreateWalletResponse(**data, status="active")


# ── Get wallet ─────────────────────────────────────────────────

@router.get("", response_model=WalletResponse)
async def get_wallet(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(404, "Wallet not found")

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    return WalletResponse(
        id=wallet.id,
        balance=wallet.balance,
        savings_balance=wallet.savings_balance,
        loan_balance=wallet.loan_balance,
        weekly_earnings=wallet.weekly_earnings,
        monthly_volume=wallet.monthly_volume,
        status=wallet.status,
        virtual_account_no=user.virtual_account_no if user else None,
        virtual_account_bank=user.virtual_account_bank if user else None,
    )


# ── Verify receiver before transfer ───────────────────────────

@router.post("/verify-receiver", response_model=VerifyReceiverResponse)
async def verify_receiver(
    body: VerifyReceiverRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Always call this BEFORE initiating a transfer.
    Shows the account name to the user for confirmation.
    """
    try:
        result = await squad_service.verify_receiver(body.account_number, body.bank_code)
        return VerifyReceiverResponse(**result)
    except ValueError as e:
        raise HTTPException(422, str(e))


# ── Send transfer ──────────────────────────────────────────────

@router.post("/send")
async def send_money(
    body: SendTransferRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Check wallet balance
    wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = wallet_result.scalar_one_or_none()
    if not wallet or wallet.balance < body.amount:
        raise HTTPException(400, "Insufficient balance")

    # Initiate transfer via Squad
    try:
        result = await squad_service.initiate_transfer(
            amount_naira=body.amount,
            account_number=body.account_number,
            bank_code=body.bank_code,
            account_name=body.account_name,
            narration=body.narration,
            user_id=user_id,
        )
    except ValueError as e:
        raise HTTPException(422, str(e))

    # Optimistic debit — reversed by webhook if transfer fails
    wallet.balance -= body.amount
    wallet.monthly_volume += body.amount

    # Write pending transaction
    tx = Transaction(
        user_id=user_id,
        type="debit",
        category="transfer",
        amount=body.amount,
        balance_after=wallet.balance,
        description=body.narration,
        reference=result["reference"],
        counterparty_name=body.account_name,
        counterparty_account=body.account_number,
        status="pending",
        ai_insight=generate_tx_insight("debit", body.amount, "transfer", body.narration),
    )
    db.add(tx)
    await db.commit()

    # Background fraud check
    asyncio.create_task(check_transaction_anomaly(
        user_id, str(tx.id),
        {"amount": body.amount, "type": "debit"},
        db,
    ))

    return {"reference": result["reference"], "status": "pending", "message": "Transfer initiated"}


# ── Transaction history ────────────────────────────────────────

@router.get("/transactions", response_model=TransactionListResponse)
async def list_transactions(
    page: int = 1,
    per_page: int = 20,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * per_page
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    txns = result.scalars().all()

    return TransactionListResponse(
        transactions=[TransactionResponse.model_validate(t) for t in txns],
        total=len(txns),
        page=page,
        per_page=per_page,
    ) 