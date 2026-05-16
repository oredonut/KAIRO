from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID


# ── Auth ───────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str
    phone: str
    password: str
    user_type: str = "worker"
    work_category: Optional[str] = None
    location: Optional[str] = None
    language_preference: str = "en"

class LoginRequest(BaseModel):
    phone: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    full_name: str
    user_type: str


# ── User ───────────────────────────────────────────────────────

class UserProfileResponse(BaseModel):
    id: UUID
    full_name: str
    phone: str
    email: Optional[str]
    user_type: str
    work_category: Optional[str]
    location: Optional[str]
    language_preference: str
    avatar_url: Optional[str]
    is_verified: bool
    squad_customer_id: Optional[str]
    virtual_account_no: Optional[str]
    virtual_account_bank: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Economic Identity ──────────────────────────────────────────

class EconomicIdentityResponse(BaseModel):
    trust_score: float
    growth_score: float
    employability_score: float
    credit_confidence: float
    economic_health: float
    activity_consistency: float
    repayment_rate: float
    total_gigs: int
    total_earnings: float
    customer_rating: float
    growth_level: int
    last_updated: datetime

    class Config:
        from_attributes = True


# ── Wallet ─────────────────────────────────────────────────────

class WalletResponse(BaseModel):
    id: UUID
    balance: float
    savings_balance: float
    loan_balance: float
    weekly_earnings: float
    monthly_volume: float
    status: str
    virtual_account_no: Optional[str]
    virtual_account_bank: Optional[str]

    class Config:
        from_attributes = True

class CreateWalletResponse(BaseModel):
    squad_customer_id: str
    virtual_account_no: str
    virtual_account_bank: str
    status: str

class SendTransferRequest(BaseModel):
    amount: float
    account_number: str
    bank_code: str
    account_name: str
    narration: str

class VerifyReceiverRequest(BaseModel):
    account_number: str
    bank_code: str

class VerifyReceiverResponse(BaseModel):
    verified: bool
    account_name: str
    account_number: str
    bank_code: str


# ── Transaction ────────────────────────────────────────────────

class TransactionResponse(BaseModel):
    id: UUID
    type: str
    category: str
    amount: float
    description: Optional[str]
    reference: Optional[str]
    counterparty_name: Optional[str]
    status: str
    ai_insight: Optional[str]
    trust_impact: float
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int
    page: int
    per_page: int


# ── Loan ───────────────────────────────────────────────────────

class LoanApplyRequest(BaseModel):
    amount_requested: float
    offer_id: Optional[str] = None

class LoanResponse(BaseModel):
    id: UUID
    amount_requested: float
    amount_approved: Optional[float]
    interest_rate: float
    tenure_months: int
    monthly_repayment: Optional[float]
    status: str
    ai_decision_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Trust Score ────────────────────────────────────────────────

class TrustRecalcRequest(BaseModel):
    user_id: str
    trigger_event: str
    event_data: dict = {}

class TrustScoreResponse(BaseModel):
    trust_score: float
    growth_score: float
    credit_confidence: float
    employability_score: float
    delta: float
    reason: str
    contributing_factors: List[dict]


# ── Voice ──────────────────────────────────────────────────────

class VoiceQueryResponse(BaseModel):
    transcript: str
    language_detected: str
    intent: str
    response_text: str
    audio_url: Optional[str]
    action: Optional[dict]

class VoiceJournalResponse(BaseModel):
    id: UUID
    transcript: str
    language_detected: str
    ai_extracted: Optional[dict]
    trust_score_impact: float
    created_at: datetime

    class Config:
        from_attributes = True


# ── Opportunity ────────────────────────────────────────────────

class OpportunityCreate(BaseModel):
    type: str = "gig"
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    payout: Optional[float] = None
    payout_label: Optional[str] = None
    trust_score_required: float = 0.0
    skills_required: List[str] = []

class OpportunityResponse(BaseModel):
    id: UUID
    type: str
    title: str
    description: Optional[str]
    location: Optional[str]
    payout: Optional[float]
    payout_label: Optional[str]
    trust_score_required: float
    skills_required: List[str]
    match_score: Optional[float] = None
    distance_km: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Admin / Heatmap ────────────────────────────────────────────

class HeatmapCell(BaseModel):
    region: str
    latitude: float
    longitude: float
    transaction_density: float
    employment_rate: float
    active_traders: int
    growth_index: float

class AdminStatsResponse(BaseModel):
    active_traders: int
    employment_growth: float
    loan_repayment_rate: float
    financial_inclusion_score: float
    total_volume: float
    new_identities_today: int
    fraud_alerts_open: int


# ── AI Chat ────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    suggestions: List[str] = []
    action: Optional[dict] = None
    session_id: str 


# ── Identity / KYC ─────────────────────────────────────────────

class BVNVerifyRequest(BaseModel):
    bvn: str

class BVNVerifyResponse(BaseModel):
    verified: bool
    full_name: Optional[str] = None
    dob: Optional[str] = None
    mobile: Optional[str] = None
    message: Optional[str] = None