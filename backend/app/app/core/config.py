from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────
    APP_ENV: str = "development"
    SUPABASE_URL: str = ""
    SUPABASE_JWT_SECRET: str = ""
    DEBUG: bool = True

    # ── Database ───────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://kairo:kairo123@localhost:5432/kairo_db"

    # ── Redis ──────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── ChromaDB ───────────────────────────────────────────────
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001

    # ── JWT ────────────────────────────────────────────────────
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── n8n ────────────────────────────────────────────────────
    N8N_WEBHOOK_TOKEN: str = ""
    N8N_BASE_URL: str = "http://localhost:5678"

    # ── Squad (Payment) ────────────────────────────────────────
    SQUAD_SECRET_KEY: str = ""
    SQUAD_PUBLIC_KEY: str = ""
    SQUAD_BASE_URL: str = "https://sandbox-api-d.squadco.com"

    # ── Google Gemini (AI) ─────────────────────────────────────
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # ── ElevenLabs (TTS) ───────────────────────────────────────
    ELEVENLABS_API_KEY: str = ""

    # ── Vapi (Voice AI) ────────────────────────────────────────
    VAPI_PRIVATE_KEY: str = ""
    VAPI_PUBLIC_KEY: str = ""
    VAPI_ASSISTANT_ID: str = ""


settings = Settings()
