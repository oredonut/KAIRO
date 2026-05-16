from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from app.core.config import settings
from app.db.database import create_tables
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────
    logger.info(f"Starting KAIRO API [{settings.APP_ENV}]")
    await create_tables()
    logger.info("Database tables ready")
    yield
    # ── Shutdown ───────────────────────────────────────────────
    logger.info("KAIRO API shutting down")


app = FastAPI(
    title="KAIRO API",
    description="AI-powered economic identity and financial intelligence platform for Africa",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    redoc_url=None,
)

# ── CORS — allow all for hackathon ──────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ─────────────────────────────────────────────────────
app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": "KAIRO", "env": settings.APP_ENV} 


# ── Run locally ────────────────────────────────────────────────
# uvicorn app.main:app --reload --port 8000