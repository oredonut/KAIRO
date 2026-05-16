from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.db.database import get_db
from app.core.security import get_current_user_id
from app.models.models import Opportunity
from app.schemas.schemas import OpportunityCreate, OpportunityResponse
from app.services.ai.job_matching import match_opportunities_for_user, summarise_demand_signals

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


@router.get("/matched")
async def get_matched_opportunities(
    limit: int = 20,
    type: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """AI-ranked opportunities for the current user."""
    matches = await match_opportunities_for_user(
        user_id=user_id,
        db=db,
        limit=limit,
        opp_type=type,
    )
    return {"opportunities": matches, "count": len(matches)}


@router.get("/demand-signals")
async def get_demand_signals(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Hyperlocal demand signals for the Opportunity Radar."""
    matches = await match_opportunities_for_user(user_id=user_id, db=db, limit=100)
    signals = summarise_demand_signals(matches)
    return {"signals": signals}


@router.get("", response_model=list[OpportunityResponse])
async def list_all(
    page: int = 1,
    per_page: int = 20,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    offset = (page - 1) * per_page
    result = await db.execute(
        select(Opportunity)
        .where(Opportunity.is_active == True)
        .order_by(Opportunity.created_at.desc())
        .offset(offset).limit(per_page)
    )
    opps = result.scalars().all()
    return [OpportunityResponse.model_validate(o) for o in opps]


@router.post("", response_model=OpportunityResponse, status_code=201)
async def create_opportunity(
    body: OpportunityCreate,
    employer_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    opp = Opportunity(employer_id=employer_id, **body.model_dump())
    db.add(opp)
    await db.commit()
    await db.refresh(opp)
    return OpportunityResponse.model_validate(opp)


@router.delete("/{opp_id}", status_code=204)
async def deactivate(
    opp_id: str,
    employer_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Opportunity).where(
            Opportunity.id == opp_id,
            Opportunity.employer_id == employer_id,
        )
    )
    opp = result.scalar_one_or_none()
    if opp:
        opp.is_active = False
        await db.commit()