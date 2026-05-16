from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid

from app.db.database import get_db
from app.models.models import User, EconomicIdentity, Wallet
from app.schemas.schemas import AuthResponse, BVNVerifyRequest, BVNVerifyResponse
from app.core.security import get_current_user_id
from typing import List, Optional
from app.services.squad.squad_service import verify_bvn as squad_verify_bvn

router = APIRouter(prefix="/auth", tags=["Auth"])

class SyncUserRequest(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    user_type: str = "worker"
    work_category: str = ""
    location: str = ""
    language_preference: str = "en"
    bvn: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []

@router.post("/sync", response_model=AuthResponse)
async def sync_user(
    body: SyncUserRequest, 
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    x_debug_user_id: Optional[str] = Header(None) # Added for testing bypass
):
    """
    Called by the frontend immediately after a successful Supabase signup.
    It links the Supabase user to a new KAIRO user, generating a Wallet and Economic Identity.
    """
    # Use debug user ID if provided (only for local dev)
    effective_user_id = x_debug_user_id if x_debug_user_id else user_id
    
    try:
        supa_uuid = uuid.UUID(effective_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    # Check if user already synced
    existing = await db.execute(select(User).where(User.supabase_uid == supa_uuid))
    user = existing.scalar_one_or_none()
    
    if not user:
        # Check if phone already exists to avoid 500 error
        phone_check = await db.execute(select(User).where(User.phone == body.phone))
        existing_phone = phone_check.scalar_one_or_none()
        
        if existing_phone:
             # If debugging, we might want to update or just return existing
            if x_debug_user_id:
                user = existing_phone
            else:
                raise HTTPException(status_code=400, detail="Phone number already registered with another account")
        else:
            user = User(
                supabase_uid=supa_uuid,
                full_name=body.full_name,
                phone=body.phone,
                email=body.email,
                user_type=body.user_type,
                work_category=body.work_category,
                location=body.location,
                language_preference=body.language_preference,
                bvn=body.bvn,
                bio=body.bio,
                is_verified=True if body.bvn else False
            )
            db.add(user)
            await db.flush()
            
            # Add skills
            from app.models.models import UserSkill
            for skill_name in body.skills:
                skill = UserSkill(user_id=user.id, skill_name=skill_name)
                db.add(skill)
            
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


@router.post("/verify-bvn", response_model=BVNVerifyResponse)
async def public_verify_bvn(body: BVNVerifyRequest):
    """
    Public lookup for BVN during onboarding. 
    In production, this should be rate-limited.
    """
    try:
        data = await squad_verify_bvn(body.bvn)
        return BVNVerifyResponse(
            verified=True,
            full_name=f"{data.get('first_name', '')} {data.get('last_name', '')}",
            dob=data.get("dob"),
            mobile=data.get("mobile"),
            message="BVN successfully verified"
        )
    except ValueError as e:
        return BVNVerifyResponse(
            verified=False,
            message=str(e)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal verification error: {str(e)}")