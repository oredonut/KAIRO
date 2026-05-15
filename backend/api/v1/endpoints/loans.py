import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.security import get_current_user_id
from app.models.models import LoanApplication, EconomicIdentity, User
from app.schemas.schemas import LoanApplyRequest, LoanResponse
from app.services.automation.n8n_service import on_loan_applied

router = APIRouter(prefix="/loans", tags=["Loans"])


@router.post("/apply", response_model=LoanResponse, status_code=201)
async def apply_for_loan(
    body: LoanApplyRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Check trust score threshold (min 50 to apply)
    identity = await db.execute(
        select(EconomicIdentity).where(EconomicIdentity.user_id == user_id)
    )
    ident = identity.scalar_one_or_none()
    if not ident or ident.trust_score < 50:
        raise HTTPException(
            400,
            f"Trust Score too low to apply. Yours: {ident.trust_score if ident else 0}/100. Minimum: 50."
        )

    # Check no active loan pending
    existing = await db.execute(
        select(LoanApplication).where(
            LoanApplication.user_id == user_id,
            LoanApplication.status.in_(["pending", "approved", "disbursed"]),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "You already have an active loan application")

    loan = LoanApplication(
        user_id=user_id,
        offer_id=body.offer_id,
        amount_requested=body.amount_requested,
        status="pending",
    )
    db.add(loan)
    await db.commit()
    await db.refresh(loan)

    # Hand off to n8n: AI decision → Squad disburse → notify
    asyncio.create_task(on_loan_applied(
        user_id=user_id,
        loan_id=str(loan.id),
        amount_requested=body.amount_requested,
    ))

    return LoanResponse.model_validate(loan)


@router.get("", response_model=list[LoanResponse])
async def my_loans(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LoanApplication)
        .where(LoanApplication.user_id == user_id)
        .order_by(LoanApplication.created_at.desc())
    )
    return [LoanResponse.model_validate(l) for l in result.scalars().all()]


# ── Internal endpoints called by n8n ──────────────────────────

@router.post("/internal/ai-decision")
async def ai_loan_decision(
    loan_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    n8n calls this after fetching economic identity scores.
    Returns approved/declined + approved amount.
    """
    identity = await db.execute(
        select(EconomicIdentity).where(EconomicIdentity.user_id == user_id)
    )
    ident = identity.scalar_one_or_none()
    if not ident:
        return {"approved": False, "reason": "No economic identity found"}

    loan_result = await db.execute(
        select(LoanApplication).where(LoanApplication.id == loan_id)
    )
    loan = loan_result.scalar_one_or_none()
    if not loan:
        return {"approved": False, "reason": "Loan not found"}

    trust  = ident.trust_score
    credit = ident.credit_confidence
    repay  = ident.repayment_rate

    # Decision logic
    approved = trust >= 65 and credit >= 55 and repay >= 80

    if approved:
        # Scale approved amount by trust score
        multiplier     = min(trust / 100 * 1.5, 1.0)
        approved_amount = min(loan.amount_requested * multiplier, 500_000)
        reason = f"Trust {trust}/100, Credit {credit}/100, Repayment {repay}% — approved."
    else:
        approved_amount = None
        gaps = []
        if trust < 65:   gaps.append(f"Trust Score {trust}/100 (need 65)")
        if credit < 55:  gaps.append(f"Credit Confidence {credit}/100 (need 55)")
        if repay < 80:   gaps.append(f"Repayment Rate {repay}% (need 80%)")
        reason = "Not approved: " + "; ".join(gaps)

    # Update loan record
    loan.status           = "approved" if approved else "pending"
    loan.amount_approved  = approved_amount
    loan.ai_decision_reason = reason
    if approved:
        loan.monthly_repayment = round(approved_amount / loan.tenure_months * 1.05, 2)
    await db.commit()

    return {
        "approved":        approved,
        "approved_amount": approved_amount,
        "reason":          reason,
        "loan_id":         loan_id,
    }


@router.post("/internal/disburse")
async def disburse_loan(
    loan_id: str,
    db: AsyncSession = Depends(get_db),
):
    """n8n calls this after approval to send funds via Squad."""
    loan_result = await db.execute(
        select(LoanApplication).where(LoanApplication.id == loan_id)
    )
    loan = loan_result.scalar_one_or_none()
    if not loan or not loan.amount_approved:
        raise HTTPException(400, "Loan not ready for disbursement")

    user_result = await db.execute(select(User).where(User.id == loan.user_id))
    user = user_result.scalar_one_or_none()

    from app.services.squad.squad_service import disburse_loan as squad_disburse
    result = await squad_disburse(
        virtual_account_no=user.virtual_account_no,
        bank_code="000013",  # Providus Bank code for Squad virtual accounts
        account_name=user.full_name,
        amount_naira=loan.amount_approved,
        loan_id=loan_id,
    )

    from datetime import datetime
    loan.status         = "disbursed"
    loan.squad_reference= result["reference"]
    loan.disbursed_at   = datetime.utcnow()
    await db.commit()

    return {"status": "disbursed", "reference": result["reference"]}