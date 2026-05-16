from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid

from app.db.database import get_db
from app.models.models import User, EconomicIdentity, Wallet
from app.schemas.schemas import AuthResponse
from app.core.security import get_current_user_id

router = APIRouter(prefix="/auth", tags=["Auth"])

class SyncUserRequest(BaseModel):
    full_name: str
    phone: str
    user_type: str = "worker"
    work_category: str = ""
    location: str = ""
    language_preference: str = "en"

@router.post("/sync", response_model=AuthResponse)
async def sync_user(
    body: SyncUserRequest, 
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Called by the frontend immediately after a successful Supabase signup.
    It links the Supabase user to a new KAIRO user, generating a Wallet and Economic Identity.
    """
    try:
        supa_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Supabase user ID in token")

    # Check if user already synced
    existing = await db.execute(select(User).where(User.supabase_uid == supa_uuid))
    user = existing.scalar_one_or_none()
    
    if not user:
        user = User(
            supabase_uid=supa_uuid,
            full_name=body.full_name,
            phone=body.phone,
            user_type=body.user_type,
            work_category=body.work_category,
            location=body.location,
            language_preference=body.language_preference,
        )
        db.add(user)
        await db.flush()  # get the internal UUID before commit
        
        # Initialize economic identity
        identity = EconomicIdentity(user_id=user.id)
        db.add(identity)
        
        # Initialize empty wallet
        wallet = Wallet(user_id=user.id)
        db.add(wallet)
        
        await db.commit()
        
        # Fire n8n onboarding workflow
        import asyncio
        from app.services.automation.n8n_service import trigger_n8n
        asyncio.create_task(trigger_n8n("user-registered", {
            "user_id": str(user.id),
            "full_name": user.full_name,
            "phone": user.phone,
            "user_type": user.user_type,
        }))
        
    return AuthResponse(
        access_token="managed_by_supabase",
        user_id=str(user.id),
        full_name=user.full_name,
        user_type=user.user_type,
    )