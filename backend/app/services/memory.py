from datetime import datetime
from app.models.db import ChatSessions, ChatMessages,KBReferences,GuardRails

def get_or_create_session(db, session_id, user_id,user_role, context):

    context_data = context.dict() if hasattr(context, "dict") else context

    session = db.query(ChatSessions).filter_by(session_id=session_id).first()

    if not session:
        session = ChatSessions(
            session_id=session_id,
            user_id=user_id, 
            user_role=user_role,
            context=context_data,
            created_at=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    return session


def save_message(
    db,
    session_db_id,
    role,
    content,
    tier=None,
    severity=None,
    need_escalation=None,
    confidence=None
):
    message = ChatMessages(
        session_id=session_db_id,
        role=role,
        content=content,
        tier=tier,
        severity=severity,
        need_escalation=need_escalation,
        confidence=confidence,
        created_at=datetime.utcnow()
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message

def load_chat_history(db, session_db_id, limit: int = 10):

    messages = (
        db.query(ChatMessages)
        .filter_by(session_id=session_db_id)
        .order_by(ChatMessages.created_at.desc()) 
        .limit(limit)
        .all()
    )

    messages.reverse()

    history_text = "\n".join(
        f"{msg.role}: {msg.content}" for msg in messages
    )

    return history_text

def save_guardrail_event(db, session_id, message_id, blocked, reason=None):
    event = GuardRails(
        session_id=session_id,   
        message_id=message_id,   
        blocked=blocked,
        reason=reason
    )
    db.add(event)
    db.commit()
    db.refresh(event)

def save_kb_references(db, session_db_id, docs):

    for doc in docs:
        kb_ref = KBReferences(
            session_id=session_db_id,   
            kb_id=doc.metadata.get("id") or doc.metadata.get("source"),
            title=doc.metadata.get("title", "Unknown Document")
        )
        db.add(kb_ref)
        db.commit()
        db.refresh(kb_ref)
