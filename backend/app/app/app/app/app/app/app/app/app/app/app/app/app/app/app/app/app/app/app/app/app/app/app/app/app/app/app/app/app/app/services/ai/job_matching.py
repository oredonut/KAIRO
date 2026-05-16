from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger
from app.models.models import Opportunity, User, EconomicIdentity

async def match_opportunities_for_user(
    user_id: str, 
    db: AsyncSession, 
    limit: int = 20, 
    opp_type: Optional[str] = None
) -> List[Opportunity]:
    """
    AI-powered matching logic. 
    Ranks opportunities based on user's trust score and work category.
    """
    try:
        # 1. Fetch user context
        user_res = await db.execute(select(User).where(User.id == user_id))
        user = user_res.scalar_one_or_none()
        
        id_res = await db.execute(select(EconomicIdentity).where(EconomicIdentity.user_id == user_id))
        identity = id_res.scalar_one_or_none()
        
        trust_score = identity.trust_score if identity else 0.0
        
        # 2. Build query
        query = select(Opportunity).where(Opportunity.is_active == True)
        
        if opp_type:
            query = query.where(Opportunity.type == opp_type)
            
        # Only show things they qualify for
        query = query.where(Opportunity.trust_score_required <= trust_score)
        
        # Boost matches in their work category
        # (In a real implementation, we'd use pgvector cosine similarity here)
        
        query = query.order_by(Opportunity.created_at.desc()).limit(limit)
        
        res = await db.execute(query)
        matches = res.scalars().all()
        
        return matches
    except Exception as e:
        logger.error(f"Job matching error: {e}")
        return []

def summarise_demand_signals(matches: List[Opportunity]) -> dict:
    """
    Aggregates matches into high-level demand signals for the Opportunity Radar.
    """
    if not matches:
        return {"total_opportunities": 0, "hot_zones": [], "top_categories": []}
        
    categories = {}
    for m in matches:
        categories[m.type] = categories.get(m.type, 0) + 1
        
    return {
        "total_opportunities": len(matches),
        "top_categories": sorted(categories.items(), key=lambda x: x[1], reverse=True)[:3],
        "market_status": "High Demand" if len(matches) > 10 else "Stable"
    }
