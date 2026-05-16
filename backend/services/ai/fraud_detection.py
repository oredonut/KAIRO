import asyncio
import numpy as np
from datetime import datetime, timedelta
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import Transaction, FraudAlert


# ── Feature vector for a single transaction ────────────────────

def build_feature_vector(tx: dict, signals: dict) -> np.ndarray:
    """
    Build a numerical feature vector for anomaly scoring.
    tx      — the incoming transaction dict
    signals — pre-computed user aggregate signals
    """
    return np.array([[
        tx.get("amount", 0),
        tx.get("hour_of_day", datetime.utcnow().hour),
        signals.get("avg_credit_amount", 0),
        signals.get("tx_frequency_90d", 0),
        signals.get("unique_counterparties", 0),
        signals.get("max_single_tx", 0),
        1 if tx.get("type") == "credit" else 0,
    ]])


# ── User aggregate signals ─────────────────────────────────────

async def get_user_signals(user_id: str, db: AsyncSession) -> dict:
    cutoff = datetime.utcnow() - timedelta(days=90)
    result = await db.execute(
        select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.created_at >= cutoff,
            Transaction.status == "success",
        )
    )
    txns = result.scalars().all()
    amounts = [t.amount for t in txns]
    credits = [t.amount for t in txns if t.type == "credit"]
    counterparties = set(t.counterparty_account for t in txns if t.counterparty_account)
    return {
        "tx_frequency_90d":      len(txns),
        "avg_credit_amount":     sum(credits) / len(credits) if credits else 0,
        "max_single_tx":         max(amounts) if amounts else 0,
        "unique_counterparties": len(counterparties),
    }


# ── Isolation Forest scoring ───────────────────────────────────

def isolation_forest_score(features: np.ndarray, signals: dict) -> tuple[float, bool]:
    """
    Rule-based anomaly scoring until a trained model is loaded.
    Returns (anomaly_score, is_anomaly).
    In production: load joblib model and call model.decision_function(features).
    """
    amount         = features[0][0]
    avg_amount     = signals.get("avg_credit_amount", 1)
    max_tx         = signals.get("max_single_tx", 1)
    tx_count       = signals.get("tx_frequency_90d", 1)
    hour           = features[0][1]

    score = 0.0

    # Amount significantly above average
    if avg_amount > 0 and amount > avg_amount * 5:
        score -= 0.3
    # Amount above historical maximum
    if max_tx > 0 and amount > max_tx * 2:
        score -= 0.25
    # Unusual hour (2am–5am)
    if 2 <= hour <= 5:
        score -= 0.15
    # First transaction ever — low baseline risk
    if tx_count == 0:
        score -= 0.1

    is_anomaly = score < -0.25
    return round(score, 4), is_anomaly


def map_severity(score: float) -> str:
    if score < -0.6:  return "critical"
    if score < -0.4:  return "high"
    if score < -0.25: return "medium"
    return "low"


# ── Main check function ────────────────────────────────────────

async def check_transaction_anomaly(
    user_id: str,
    transaction_id: str,
    tx: dict,
    db: AsyncSession,
) -> None:
    """
    Runs after every transaction write.
    If anomaly detected, inserts fraud_alert and fires n8n.
    Always import n8n_service here (not at top) to avoid circular imports.
    """
    try:
        signals  = await get_user_signals(user_id, db)
        features = build_feature_vector(tx, signals)
        score, is_anomaly = isolation_forest_score(features, signals)

        if not is_anomaly:
            return

        severity = map_severity(score)
        logger.warning(f"Anomaly detected | user={user_id} | score={score} | severity={severity}")

        # Write fraud alert
        alert = FraudAlert(
            user_id=user_id,
            transaction_id=transaction_id,
            severity=severity,
            anomaly_score=score,
            description=f"Unusual transaction pattern detected. Score: {score}",
            status="open",
        )
        db.add(alert)
        await db.commit()

        # Fire n8n (imported here to avoid circular imports)
        from app.services.automation.n8n_service import on_fraud_flagged
        await on_fraud_flagged(user_id, transaction_id, score, severity)

    except Exception as e:
        logger.error(f"Fraud check failed for user {user_id}: {e}")