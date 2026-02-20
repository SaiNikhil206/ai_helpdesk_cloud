from datetime import datetime
import uuid
from enum import Enum
from sqlalchemy import Column, String, Integer, Text,DateTime, Float, Boolean, ForeignKey,Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.init_db import Base

class UserRole(str, Enum):
    Trainee = "trainee"
    Instructor = "instructor"
    Operator = "operator"
    SupportEngineer = "support engineer"
    Admin = "admin"


class Tier(str, Enum):
    TIER_0 = "TIER_0"
    TIER_1 = "TIER_1"
    TIER_2 = "TIER_2"
    TIER_3 = "TIER_3"
    TIER_4 = "TIER_4"


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class TicketStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole, name="user_role_enum"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("ChatSessions", back_populates="user")

class ChatSessions(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True, nullable=False)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    user_role = Column(SQLEnum(UserRole, name="session_role_enum"), nullable=False)
    context = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sessions")
    messages = relationship("ChatMessages", back_populates="session", cascade="all, delete")
    kb_references = relationship("KBReferences", back_populates="session", cascade="all, delete")
    tickets = relationship("Ticket", back_populates="session", cascade="all, delete")

class ChatMessages(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(SQLEnum(MessageRole, name="message_role_enum"), nullable=False)
    content = Column(Text, nullable=False)
    confidence = Column(Float, nullable=True)
    need_escalation = Column(Boolean, nullable=True)
    tier = Column(SQLEnum(Tier, name="tier_enum"), nullable=True)
    severity = Column(SQLEnum(Severity, name="severity_enum"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("ChatSessions", back_populates="messages")
    guardrails = relationship("GuardRails", back_populates="message", cascade="all, delete")

class KBReferences(Base):
    __tablename__ = "kb_references"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    kb_id = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("ChatSessions", back_populates="kb_references")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String(50), primary_key=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    tier = Column(SQLEnum(Tier, name="ticket_tier_enum"), nullable=False)
    severity = Column(SQLEnum(Severity, name="ticket_severity_enum"), nullable=False)
    status = Column(SQLEnum(TicketStatus, name="ticket_status_enum"), default=TicketStatus.OPEN)
    user_role = Column(SQLEnum(UserRole, name="ticket_role_enum"), nullable=False)
    ai_results = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    session = relationship("ChatSessions", back_populates="tickets")


class GuardRails(Base):
    __tablename__ = "guardrail_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_messages.id"), nullable=False)
    blocked = Column(Boolean, nullable=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("ChatSessions")
    message = relationship("ChatMessages", back_populates="guardrails")
