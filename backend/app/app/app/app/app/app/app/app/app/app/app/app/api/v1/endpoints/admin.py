from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime, timedelta

from app.db.database import get_db
from app.core.security import get_current_user_id
from app.models.models import User, Transaction, LoanApplication, FraudAlert, EconomicIdentity
from app.schemas.schemas import AdminStatsResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    today = datetime.utcnow().date()

    total_traders = await db.execute(
        select(func.count(User.id)).where(User.user_type == "worker")
    )
    new_today = await db.execute(
        select(func.count(User.id)).where(
            func.date(User.created_at) == today
        )
    )
    fraud_open = await db.execute(
        select(func.count(FraudAlert.id)).where(FraudAlert.status == "open")
    )
    loans = await db.execute(select(LoanApplication))
    all_loans = loans.scalars().all()
    repaid    = [l for l in all_loans if l.status == "repaid"]
    disbursed = [l for l in all_loans if l.status in ("disbursed", "repaying", "repaid")]
    repay_rate = (len(repaid) / len(disbursed) * 100) if disbursed else 100.0

    tx_vol = await db.execute(
        select(func.sum(Transaction.amount)).where(Transaction.status == "success")
    )

    avg_trust = await db.execute(select(func.avg(EconomicIdentity.trust_score)))

    return AdminStatsResponse(
        active_traders=total_traders.scalar() or 0,
        employment_growth=18.3,          # replace with real calculation
        loan_repayment_rate=round(repay_rate, 1),
        financial_inclusion_score=round((avg_trust.scalar() or 0), 1),
        total_volume=tx_vol.scalar() or 0,
        new_identities_today=new_today.scalar() or 0,
        fraud_alerts_open=fraud_open.scalar() or 0,
    )


@router.get("/heatmap")
async def get_heatmap(
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns transaction density per region for Mapbox heatmap.
    Aggregates user lat/lng with transaction volumes.
    """
    result = await db.execute(
        select(
            User.location,
            User.latitude,
            User.longitude,
            func.count(Transaction.id).label("tx_count"),
            func.sum(Transaction.amount).label("tx_volume"),
        )
        .join(Transaction, Transaction.user_id == User.id)
        .where(User.latitude.isnot(None))
        .group_by(User.location, User.latitude, User.longitude)
        .limit(200)
    )
    rows = result.fetchall()
    max_count = max((r.tx_count for r in rows), default=1)

    return {
        "cells": [
            {
                "region":               r.location or "Unknown",
                "latitude":             r.latitude,
                "longitude":            r.longitude,
                "transaction_density":  round(r.tx_count / max_count, 3),
                "transaction_volume":   r.tx_volume or 0,
                "active_traders":       r.tx_count,
                "growth_index":         round(min(r.tx_count / 10, 1.0), 3),
            }
            for r in rows
        ]
    }


@router.get("/activity-feed")
async def get_activity_feed(
    limit: int = 20,
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Live event feed for admin dashboard."""
    tx_result = await db.execute(
        select(Transaction, User.location)
        .join(User, User.id == Transaction.user_id)
        .where(Transaction.status == "success")
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    rows = tx_result.fetchall()

    fraud_result = await db.execute(
        select(FraudAlert)
        .order_by(FraudAlert.created_at.desc())
        .limit(5)
    )
    alerts = fraud_result.scalars().all()

    feed = []
    for tx, location in rows:
        feed.append({
            "event_type":  "transaction",
            "description": f"₦{tx.amount:,.0f} {tx.type} · {location or 'Nigeria'}",
            "severity":    "info",
            "timestamp":   tx.created_at.isoformat(),
        })
    for alert in alerts:
        feed.append({
            "event_type":  "fraud_alert",
            "description": alert.description or "Anomaly detected",
            "severity":    alert.severity,
            "timestamp":   alert.created_at.isoformat(),
        })

    feed.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"feed": feed[:limit]}