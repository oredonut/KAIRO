from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.wallet import router as wallet_router
from app.api.v1.endpoints.webhooks import router as webhook_router
from app.api.v1.endpoints.trust import router as trust_router
from app.api.v1.endpoints.opportunities import router as opp_router
from app.api.v1.endpoints.loans import router as loan_router
from app.api.v1.endpoints.voice import router as voice_router
from app.api.v1.endpoints.voice_onboard import router as voice_onboard_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.users_and_chat import profile_router, chat_router
from app.api.v1.endpoints.notifications import router as notif_router
from app.api.v1.endpoints.escrow import router as escrow_router
from app.api.v1.endpoints.rl import router as rl_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(wallet_router)
api_router.include_router(webhook_router)
api_router.include_router(trust_router)
api_router.include_router(opp_router)
api_router.include_router(loan_router)
api_router.include_router(voice_router)
api_router.include_router(voice_onboard_router)
api_router.include_router(admin_router)
api_router.include_router(chat_router)
api_router.include_router(notif_router)
api_router.include_router(escrow_router)
api_router.include_router(rl_router) 