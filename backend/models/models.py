import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean,
    DateTime, ForeignKey, Text, JSON, Enum as SAEnum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


# ── Enums ──────────────────────────────────────────────────────

class UserType(str, enum.Enum):
    worker = "worker"
    employer = "employer"
    admin = "admin"

class WalletStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    suspended = "suspended"

class TxType(str, enum.Enum):
    credit = "credit"
    debit = "debit"

class TxStatus(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"

class LoanStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    disbursed = "disbursed"
    repaying = "repaying"
    repaid = "repaid"
    defaulted = "defaulted"

class FraudSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


# ── User ───────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String(120), nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(160), unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)
    user_type = Column(SAEnum(UserType), default=UserType.worker, nullable=False)
    work_category = Column(String(80), nullable=True)
    location = Column(String(120), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    language_preference = Column(String(10), default="en")
    avatar_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    bvn = Column(String(20), nullable=True)
    nin = Column(String(20), nullable=True)
    id_image_url = Column(String, nullable=True)
    selfie_url = Column(String, nullable=True)
    # Squad
    squad_customer_id = Column(String, nullable=True, unique=True)
    virtual_account_no = Column(String(20), nullable=True)
    virtual_account_bank = Column(String(60), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    economic_identity = relationship("EconomicIdentity", back_populates="user", uselist=False)
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    transactions = relationship("Transaction", back_populates="user")
    loans = relationship("LoanApplication", back_populates="user")
    trust_trail = relationship("TrustTrailEvent", back_populates="user")
    voice_journals = relationship("VoiceJournal", back_populates="user")
    skills = relationship("UserSkill", back_populates="user")


# ── Economic Identity ──────────────────────────────────────────

class EconomicIdentity(Base):
    __tablename__ = "economic_identities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    trust_score = Column(Float, default=0.0)
    growth_score = Column(Float, default=0.0)
    employability_score = Column(Float, default=0.0)
    credit_confidence = Column(Float, default=0.0)
    economic_health = Column(Float, default=0.0)
    activity_consistency = Column(Float, default=0.0)
    repayment_rate = Column(Float, default=100.0)
    total_gigs = Column(Integer, default=0)
    total_earnings = Column(Float, default=0.0)
    customer_rating = Column(Float, default=0.0)
    growth_level = Column(Integer, default=1)
    # RL model state
    rl_state_vector = Column(JSON, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="economic_identity")


# ── Wallet ─────────────────────────────────────────────────────

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    balance = Column(Float, default=0.0)
    savings_balance = Column(Float, default=0.0)
    loan_balance = Column(Float, default=0.0)
    weekly_earnings = Column(Float, default=0.0)
    monthly_volume = Column(Float, default=0.0)
    status = Column(SAEnum(WalletStatus), default=WalletStatus.pending)
    currency = Column(String(5), default="NGN")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="wallet")


# ── Transaction ────────────────────────────────────────────────

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    type = Column(SAEnum(TxType), nullable=False)
    category = Column(String(40), default="general")
    amount = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=True)
    description = Column(String(200), nullable=True)
    reference = Column(String(80), unique=True, nullable=True)
    squad_ref = Column(String(80), nullable=True)
    counterparty_name = Column(String(120), nullable=True)
    counterparty_account = Column(String(20), nullable=True)
    status = Column(SAEnum(TxStatus), default=TxStatus.pending)
    ai_insight = Column(String(200), nullable=True)
    trust_impact = Column(Float, default=0.0)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")


# ── Loan ───────────────────────────────────────────────────────

class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    offer_id = Column(String(80), nullable=True)
    amount_requested = Column(Float, nullable=False)
    amount_approved = Column(Float, nullable=True)
    interest_rate = Column(Float, default=5.0)
    tenure_months = Column(Integer, default=3)
    monthly_repayment = Column(Float, nullable=True)
    status = Column(SAEnum(LoanStatus), default=LoanStatus.pending)
    ai_decision_reason = Column(Text, nullable=True)
    squad_reference = Column(String(80), nullable=True)
    disbursed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="loans")


# ── Trust Trail ────────────────────────────────────────────────

class TrustTrailEvent(Base):
    __tablename__ = "trust_trail"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    event_type = Column(String(60), nullable=False)
    description = Column(Text, nullable=True)
    verifier = Column(String(120), nullable=True)
    score_before = Column(Float, nullable=True)
    score_after = Column(Float, nullable=True)
    delta = Column(Float, default=0.0)
    event_hash = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="trust_trail")


# ── Voice Journal ──────────────────────────────────────────────

class VoiceJournal(Base):
    __tablename__ = "voice_journals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    audio_url = Column(String, nullable=True)
    transcript = Column(Text, nullable=True)
    language_detected = Column(String(10), default="en")
    ai_extracted = Column(JSON, nullable=True)
    trust_score_impact = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="voice_journals")


# ── Skill ──────────────────────────────────────────────────────

class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    skill_name = Column(String(80), nullable=False)
    proficiency = Column(String(20), default="intermediate")
    ai_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="skills")


# ── Opportunity ────────────────────────────────────────────────

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    type = Column(String(40), default="gig")
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(120), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    payout = Column(Float, nullable=True)
    payout_label = Column(String(60), nullable=True)
    trust_score_required = Column(Float, default=0.0)
    skills_required = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    embedding_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Fraud Alert ────────────────────────────────────────────────

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=True)
    severity = Column(SAEnum(FraudSeverity), default=FraudSeverity.low)
    anomaly_score = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="open")
    created_at = Column(DateTime, default=datetime.utcnow)