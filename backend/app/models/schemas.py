from datetime import datetime
from pydantic import BaseModel, Field
from app.models.db import UserRole
from typing import Any, Optional, Dict

class UserRegister(BaseModel):
    username: str
    password: str
    role: UserRole

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    session_id: str


class ChatContext(BaseModel):
    module: Optional[str] = Field(None, description="The module of the chat context")
    channel: Optional[str] = Field(None, description="The channel of the chat context")

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The user's question")
    context: ChatContext = Field(..., description="The context of the chat session")
    session_id: Optional[str] = None
    user_role: Optional[str] = None
    user_id: Optional[str] = None 

class KBReference(BaseModel):
    id: str = Field(..., description="Unique identifier for the knowledge base reference")
    title: str = Field(..., description="Title of the knowledge base reference")

class GuardRail(BaseModel):
    blocked: bool = Field(..., description="Indicates whether the message is blocked by guardrails")
    reason: Optional[str] = Field(None, description="The reason why the message was blocked, if applicable")

class ChatResponse(BaseModel):
    answer: str = Field(..., description="The assistant's response to the user's message")
    kb_references: list[KBReference] = Field(default_factory=list, description="List of knowledge base references used to generate the response")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence score of the assistant's response")
    tier: Optional[str] = Field(None, description="The tier of the issue, if applicable")
    severity: Optional[str] = Field(None, description="The severity of the issue, if applicable")
    needEscalation: Optional[bool] = Field(None, description="Indicates whether the issue needs escalation")
    guardrail: Optional[GuardRail] = Field(None, description="Guardrail information if the message was blocked")
    ticketId: Optional[str] = Field(None, description="The ID of the ticket created for this issue, if applicable")

class TicketCreate(BaseModel):

    session_id: str | int = Field(..., example="uuid-session-id")
    tier: str = Field(..., example="TIER_2")
    severity: str = Field(..., example="HIGH")
    user_role: str = Field(..., example="trainee")
    ai_results: Optional[Dict[str, Any]] = Field(default=None,description="AI classification / metadata")


class TicketResponse(BaseModel):

    id: str
    session_id: str | int
    tier: str
    severity: str
    status: str
    user_role: str
    ai_results: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime


class TicketUpdate(BaseModel):
    status: str = Field(None, example="CLOSED")
    tier: Optional[str] = Field(None, example="TIER_2")
    severity: Optional[str] = Field(None, example="HIGH")
    

