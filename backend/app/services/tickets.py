from app.models.db import Ticket
from sqlalchemy import and_
import uuid

def find_existing_ticket(db, session_id: int, message: str):

    recent_tickets = (
        db.query(Ticket)
        .filter(
            and_(
                Ticket.session_id == session_id,
                Ticket.status == "OPEN"
            )
        )
        .all()
    )

    return recent_tickets[0] if recent_tickets else None

CATEGORY_RULES = {
    "AUTH": ["login", "authentication", "mfa", "redirect"],
    "VM": ["vm", "kernel", "crash", "freeze"],
    "DNS": ["dns", "resolve", "domain"],
    "CONTAINER": ["container", "startup.sh"],
    "SECURITY": ["disable logging", "bypass", "host access"],
}

def detect_category(message: str) -> str:
    msg = message.lower()

    for category, keywords in CATEGORY_RULES.items():
        if any(word in msg for word in keywords):
            return category

    return "GENERAL"


def create_ticket_if_needed(db, session, request, response):

    if not response.needEscalation:
        return None

    # Deduplication check
    existing = find_existing_ticket(db, session.id, request.message)
    if existing:
        return existing

    category = detect_category(request.message)

    ticket = Ticket(
        id=str(uuid.uuid4()),
        session_id=session.id,
        tier=response.tier,
        severity=response.severity,
        status="OPEN",
        user_role=request.user_role,
        ai_results={
            "confidence": response.confidence,
            "category": category,
            "kbReferences": response.kb_references
,
        }
    )

    db.add(ticket)
    db.flush()

    return ticket




