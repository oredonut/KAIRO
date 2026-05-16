import hashlib
import json
import numpy as np
from datetime import datetime, timedelta
from typing import Optional
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.models import Transaction, EconomicIdentity, TrustTrailEvent, LoanApplication
from app.db.redis_client import cache_get, cache_set


# ── Feature extraction from DB signals ────────────────────────

async def extract_user_signals(user_id: str, db: AsyncSession) -> dict:
    """
    Pull all behavioral signals for a user from the last 90 days.
    These become the feature vector for the trust scoring model.
    """
    cutoff = datetime.utcnow() - timedelta(days=90)

    # All transactions
    result = await db.execute(
        select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.created_at >= cutoff,
            Transaction.status == "success",
        )
    )
    txns = result.scalars().all()

    credits = [t for t in txns if t.type == "credit"]
    debits  = [t for t in txns if t.type == "debit"]

    # Loan repayment rate
    loan_result = await db.execute(
        select(LoanApplication).where(LoanApplication.user_id == user_id)
    )
    loans = loan_result.scalars().all()
    disbursed = [l for l in loans if l.status in ("disbursed", "repaying", "repaid")]
    repaid    = [l for l in loans if l.status == "repaid"]
    repayment_rate = (len(repaid) / len(disbursed) * 100) if disbursed else 100.0

    # Income consistency: how many distinct weeks had income
    weeks_with_income = len(set(
        t.created_at.isocalendar()[1] for t in credits
    )) if credits else 0

    # Unique counterparties (network breadth)
    unique_counterparties = len(set(
        t.counterparty_account for t in txns if t.counterparty_account
    ))

    total_credit  = sum(t.amount for t in credits)
    total_debit   = sum(t.amount for t in debits)
    avg_credit    = total_credit / len(credits) if credits else 0
    tx_frequency  = len(txns)

    return {
        "tx_frequency_90d":       tx_frequency,
        "total_credit_90d":       total_credit,
        "avg_credit_amount":      avg_credit,
        "income_consistency":     weeks_with_income,
        "unique_counterparties":  unique_counterparties,
        "repayment_rate":         repayment_rate,
        "credit_debit_ratio":     total_credit / max(total_debit, 1),
        "has_savings":            any(t.category == "savings" for t in debits),
    }


# ── Trust score calculator ─────────────────────────────────────

def calculate_trust_score(signals: dict) -> dict:
    """
    Rule-based + weighted scoring model.
    Produces 0-100 scores for each dimension.
    In production replace with trained XGBoost model loaded from joblib.
    """
    s = signals

    # ── Trust Score (payment reliability + activity) ───────────
    trust = 0.0
    trust += min(s["tx_frequency_90d"] / 30, 1.0) * 25        # activity volume
    trust += min(s["income_consistency"] / 8, 1.0) * 20       # weekly consistency
    trust += (s["repayment_rate"] / 100) * 20                  # repayment reliability
    trust += min(s["unique_counterparties"] / 10, 1.0) * 15   # network breadth
    trust += min(s["avg_credit_amount"] / 50000, 1.0) * 10    # income level
    trust += (10 if s["has_savings"] else 0)                   # saving behavior
    trust = round(min(trust, 100), 2)

    # ── Growth Score ───────────────────────────────────────────
    growth = round(min(
        (s["income_consistency"] / 13 * 40) +
        (min(s["total_credit_90d"] / 500000, 1.0) * 40) +
        (min(s["tx_frequency_90d"] / 50, 1.0) * 20),
        100,
    ), 2)

    # ── Employability Score ────────────────────────────────────
    employability = round(min(
        (trust * 0.5) +
        (s["income_consistency"] / 13 * 30) +
        (min(s["unique_counterparties"] / 15, 1.0) * 20),
        100,
    ), 2)

    # ── Credit Confidence ──────────────────────────────────────
    credit = round(min(
        (s["repayment_rate"] * 0.4) +
        (min(s["total_credit_90d"] / 300000, 1.0) * 30) +
        (s["income_consistency"] / 13 * 20) +
        (10 if s["has_savings"] else 0),
        100,
    ), 2)

    # ── Economic Health ────────────────────────────────────────
    health = round((trust + growth + employability + credit) / 4, 2)

    contributing_factors = [
        {"factor": "Transaction frequency", "value": s["tx_frequency_90d"], "weight": 25},
        {"factor": "Income consistency",    "value": s["income_consistency"], "weight": 20},
        {"factor": "Repayment rate",        "value": s["repayment_rate"],    "weight": 20},
        {"factor": "Network breadth",       "value": s["unique_counterparties"], "weight": 15},
        {"factor": "Average income",        "value": round(s["avg_credit_amount"], 2), "weight": 10},
        {"factor": "Savings behavior",      "value": s["has_savings"], "weight": 10},
    ]

    return {
        "trust_score":         trust,
        "growth_score":        growth,
        "employability_score": employability,
        "credit_confidence":   credit,
        "economic_health":     health,
        "activity_consistency": round(min(s["income_consistency"] / 13 * 100, 100), 2),
        "repayment_rate":      s["repayment_rate"],
        "contributing_factors": contributing_factors,
    }


# ── Main recalculation function ────────────────────────────────

async def recalculate_trust(
    user_id: str,
    trigger_event: str,
    event_data: dict,
    db: AsyncSession,
) -> dict:
    """
    Full trust recalculation pipeline.
    Called by: n8n webhook endpoint, or directly from FastAPI routes.
    """
    logger.info(f"Trust recalc for {user_id} | event={trigger_event}")

    # 1. Extract signals
    signals = await extract_user_signals(user_id, db)

    # 2. Apply event-specific boosts
    if trigger_event == "gig_completed":
        signals["tx_frequency_90d"] += 2
        signals["income_consistency"] = min(signals["income_consistency"] + 0.5, 13)
    elif trigger_event == "loan_repaid":
        signals["repayment_rate"] = min(signals["repayment_rate"] + 5, 100)
    elif trigger_event == "savings_deposit":
        signals["has_savings"] = True
    elif trigger_event == "fraud_detected":
        signals["repayment_rate"] = max(signals["repayment_rate"] - 20, 0)
        signals["tx_frequency_90d"] = max(signals["tx_frequency_90d"] - 5, 0)

    # 3. Calculate new scores
    new_scores = calculate_trust_score(signals)

    # 4. Fetch previous scores
    result = await db.execute(
        select(EconomicIdentity).where(EconomicIdentity.user_id == user_id)
    )
    identity = result.scalar_one_or_none()
    prev_trust = identity.trust_score if identity else 0.0

    # 5. Persist to DB
    if identity:
        identity.trust_score         = new_scores["trust_score"]
        identity.growth_score        = new_scores["growth_score"]
        identity.employability_score = new_scores["employability_score"]
        identity.credit_confidence   = new_scores["credit_confidence"]
        identity.economic_health     = new_scores["economic_health"]
        identity.activity_consistency= new_scores["activity_consistency"]
        identity.repayment_rate      = new_scores["repayment_rate"]
        identity.last_updated        = datetime.utcnow()
    else:
        identity = EconomicIdentity(
            user_id=user_id,
            **{k: v for k, v in new_scores.items() if k != "contributing_factors"},
        )
        db.add(identity)

    await db.commit()

    # 6. Append Trust Trail event
    delta = round(new_scores["trust_score"] - prev_trust, 2)
    if delta != 0:
        event_hash = hashlib.sha256(
            f"{user_id}{trigger_event}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]

        trail = TrustTrailEvent(
            user_id=user_id,
            event_type=trigger_event,
            description=f"Trust score changed by {delta:+.2f} due to {trigger_event}",
            score_before=prev_trust,
            score_after=new_scores["trust_score"],
            delta=delta,
            event_hash=event_hash,
        )
        db.add(trail)
        await db.commit()

    # 7. Cache the result
    await cache_set(
        f"trust:{user_id}",
        json.dumps(new_scores),
        ttl=600,
    )

    result_payload = {
        **new_scores,
        "delta": delta,
        "reason": trigger_event,
        "signals": signals,
    }
    logger.info(f"Trust recalc done | user={user_id} | trust={new_scores['trust_score']} | Δ={delta}")
    return result_payload


# ── AI transaction insight label ───────────────────────────────

def generate_tx_insight(tx_type: str, amount: float, category: str, narration: str = "") -> Optional[str]:
    narration = (narration or "").lower()
    if tx_type == "credit":
        if amount >= 50000:
            return "Large income detected — great week for business!"
        if "gig" in narration or "job" in narration:
            return "Gig payment received — trust signal logged."
        return "Income received — consistent earnings build your score."
    if "loan" in narration or "repay" in narration:
        return "On-time repayment improves your credit confidence."
    if category == "savings":
        return "Savings deposit — building your financial safety net."
    return None