from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.models import User, EconomicIdentity, Wallet
from app.schemas.schemas import RegisterRequest, LoginRequest, AuthResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check phone already exists
    existing = await db.execute(select(User).where(User.phone == body.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Phone number already registered")

    # Create user
    user = User(
        full_name=body.full_name,
        phone=body.phone,
        password_hash=hash_password(body.password),
        user_type=body.user_type,
        work_category=body.work_category,
        location=body.location,
        language_preference=body.language_preference,
    )
    db.add(user)
    await db.flush()  # get the UUID before commit

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

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(
        access_token=token,
        user_id=str(user.id),
        full_name=user.full_name,
        user_type=user.user_type,
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash or ""):
        raise HTTPException(status_code=401, detail="Invalid phone or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account suspended")

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(
        access_token=token,
        user_id=str(user.id),
        full_name=user.full_name,
        user_type=user.user_type,
    )