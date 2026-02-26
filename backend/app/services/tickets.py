from app.models.db import Ticket
from sqlalchemy import and_
import uuid

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


def find_existing_ticket(db,session_id: int,category: str,severity: str):
    return (
        db.query(Ticket)
        .filter(
            Ticket.session_id == session_id,
            Ticket.status == "OPEN",
            Ticket.severity == severity,
            Ticket.ai_results["category"].astext == category 
        )
        .first()
    )


def create_ticket_if_needed(db, session, request, response):

    if not response.needEscalation:
        return None

    # Detect category first
    category = detect_category(request.message)

    # Check smarter deduplication
    existing = find_existing_ticket(
        db=db,
        session_id=session.id,
        category=category,
        severity=response.severity
    )

    if existing:
        return existing

    # Create new ticket
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
            "kbReferences": [
                {
                    "id": ref.get("id"),
                    "title": ref.get("title")
                }
                for ref in (response.kb_references or [])
            ]
        }
    )

    db.add(ticket)
    db.flush()

    return ticket