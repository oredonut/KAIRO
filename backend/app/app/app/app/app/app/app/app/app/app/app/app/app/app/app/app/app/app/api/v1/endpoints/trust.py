from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.security import get_current_user_id
from app.models.models import EconomicIdentity, TrustTrailEvent
from app.schemas.schemas import TrustScoreResponse, TrustRecalcRequest, EconomicIdentityResponse
from app.services.ai.trust_scoring import recalculate_trust

router = APIRouter(prefix="/trust", tags=["Trust Score"])


# ── Get current scores ─────────────────────────────────────────

@router.get("/scores", response_model=EconomicIdentityResponse)
async def get_scores(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EconomicIdentity).where(EconomicIdentity.user_id == user_id)
    )
    identity = result.scalar_one_or_none()
    if not identity:
        raise HTTPException(404, "Economic identity not found")
    return EconomicIdentityResponse.model_validate(identity)


# ── Trust trail history ────────────────────────────────────────

@router.get("/trail")
async def get_trust_trail(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    result = await db.execute(
        select(TrustTrailEvent)
        .where(TrustTrailEvent.user_id == user_id)
        .order_by(TrustTrailEvent.timestamp.desc())
        .limit(limit)
    )
    events = result.scalars().all()
    return [
        {
            "id":           str(e.id),
            "event_type":   e.event_type,
            "description":  e.description,
            "score_before": e.score_before,
            "score_after":  e.score_after,
            "delta":        e.delta,
            "event_hash":   e.event_hash,
            "timestamp":    e.timestamp.isoformat(),
        }
        for e in events
    ]


# ── Internal endpoint called by n8n ───────────────────────────

@router.post("/internal/recalculate", response_model=TrustScoreResponse)
async def internal_recalculate(
    body: TrustRecalcRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Called exclusively by n8n workflows — NOT exposed to frontend.
    Protect with API key or IP whitelist in production.
    """
    result = await recalculate_trust(
        user_id=body.user_id,
        trigger_event=body.trigger_event,
        event_data=body.event_data,
        db=db,
    )
    return TrustScoreResponse(
        trust_score=result["trust_score"],
        growth_score=result["growth_score"],
        credit_confidence=result["credit_confidence"],
        employability_score=result["employability_score"],
        delta=result["delta"],
        reason=result["reason"],
        contributing_factors=result["contributing_factors"],
    ) 