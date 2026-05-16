from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.security import get_current_user_id
from app.models.models import User, EconomicIdentity, Wallet, UserSkill
from app.schemas.schemas import (
<<<<<<< HEAD:backend/api/v1/endpoints/usersandchat.py
    UserProfileResponse, ChatRequest, ChatResponse, EconomicIdentityResponse
=======
    UserProfileResponse, ChatRequest, ChatResponse, EconomicIdentityResponse,
    BVNVerifyRequest, BVNVerifyResponse
>>>>>>> ffc6a483c8e5486be53e6a1455a67dbd267379fa:backend/api/v1/endpoints/users_and_chat.py
)
from app.services.ai.chat_service import chat_with_advisor

# ── Profile router ─────────────────────────────────────────────
profile_router = APIRouter(prefix="/users", tags=["Profile"])

@profile_router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return UserProfileResponse.model_validate(user)


@profile_router.patch("/me")
async def update_profile(
    full_name: str = None,
    work_category: str = None,
    location: str = None,
    bio: str = None,
    latitude: float = None,
    longitude: float = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    if full_name:     user.full_name     = full_name
    if work_category: user.work_category = work_category
    if location:      user.location      = location
    if bio:           user.bio           = bio
    if latitude:      user.latitude      = latitude
    if longitude:     user.longitude     = longitude

    await db.commit()
    return {"status": "updated"}


@profile_router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Upload avatar to Cloudinary and save URL."""
    import cloudinary.uploader
    from app.core.config import settings
    import cloudinary

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )

    contents = await file.read()
    upload_result = cloudinary.uploader.upload(
        contents,
        public_id=f"kairo/avatars/{user_id}",
        overwrite=True,
        resource_type="image",
    )
    url = upload_result.get("secure_url")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        user.avatar_url = url
        await db.commit()

    return {"avatar_url": url}


@profile_router.post("/me/skills")
async def add_skill(
    skill_name: str,
    proficiency: str = "intermediate",
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    skill = UserSkill(user_id=user_id, skill_name=skill_name, proficiency=proficiency)
    db.add(skill)
    await db.commit()
    return {"status": "added", "skill": skill_name}


@profile_router.get("/me/skills")
async def list_skills(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserSkill).where(UserSkill.user_id == user_id))
    return [{"skill": s.skill_name, "proficiency": s.proficiency} for s in result.scalars().all()]


@profile_router.get("/me/economic-identity", response_model=EconomicIdentityResponse)
async def get_economic_identity(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EconomicIdentity).where(EconomicIdentity.user_id == user_id)
    )
    identity = result.scalar_one_or_none()
    if not identity:
        raise HTTPException(404, "Economic identity not initialised yet")
    return EconomicIdentityResponse.model_validate(identity)


# ── KYC upload ─────────────────────────────────────────────────

@profile_router.post("/me/kyc")
async def submit_kyc(
    id_file: UploadFile = File(...),
    selfie: UploadFile = File(...),
    id_type: str = "NIN",
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    import cloudinary.uploader
    import cloudinary
    import asyncio
    from app.core.config import settings

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )

    id_bytes     = await id_file.read()
    selfie_bytes = await selfie.read()

    id_upload = cloudinary.uploader.upload(
        id_bytes, public_id=f"kairo/kyc/{user_id}/id", overwrite=True
    )
    selfie_upload = cloudinary.uploader.upload(
        selfie_bytes, public_id=f"kairo/kyc/{user_id}/selfie", overwrite=True
    )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        user.id_image_url = id_upload["secure_url"]
        user.selfie_url   = selfie_upload["secure_url"]
        await db.commit()

    from app.services.automation.n8n_service import on_kyc_submitted
    asyncio.create_task(on_kyc_submitted(
        user_id=user_id,
        id_image_url=id_upload["secure_url"],
        selfie_url=selfie_upload["secure_url"],
        id_type=id_type,
    ))

    return {"status": "processing", "message": "KYC submitted. Verification in progress."}


# ── Chat router ────────────────────────────────────────────────
chat_router = APIRouter(prefix="/chat", tags=["AI Chat"])

@chat_router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """KAIRO Advisor — contextual Claude-powered chat with live user data."""

    # Build user context from DB
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    ident_result = await db.execute(
        select(EconomicIdentity).where(EconomicIdentity.user_id == user_id)
    )
    ident = ident_result.scalar_one_or_none()

    wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = wallet_result.scalar_one_or_none()

    context = {
        "full_name":        user.full_name if user else "User",
        "work_category":    user.work_category if user else "",
        "location":         user.location if user else "Nigeria",
        "language":         body.language,
        "trust_score":      ident.trust_score if ident else 0,
        "growth_score":     ident.growth_score if ident else 0,
        "credit_confidence":ident.credit_confidence if ident else 0,
        "balance":          wallet.balance if wallet else 0,
        "weekly_earnings":  wallet.weekly_earnings if wallet else 0,
        "total_gigs":       ident.total_gigs if ident else 0,
        "repayment_rate":   ident.repayment_rate if ident else 100,
    }

    result = await chat_with_advisor(
        user_message=body.message,
        user_context=context,
        session_id=body.session_id,
        language=body.language,
    )

    return ChatResponse(
        reply=result["reply"],
        suggestions=result["suggestions"],
        session_id=result["session_id"],
        action=result.get("action"),
    )