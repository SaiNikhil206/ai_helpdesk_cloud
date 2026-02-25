from sqlalchemy import func
from app.models.db import Ticket,GuardRails,ChatSessions,ChatMessages,TicketStatus
from datetime import datetime, timedelta
from collections import defaultdict

def metrics_summary(db):

    total_tickets = db.query(func.count(Ticket.id)).scalar()

    open_tickets = db.query(func.count(Ticket.id)) \
        .filter(Ticket.status == TicketStatus.OPEN) \
        .scalar()

    closed_tickets = db.query(func.count(Ticket.id)) \
        .filter(Ticket.status == TicketStatus.RESOLVED) \
        .scalar()

    # Tickets by Severity
    severity_rows = db.query(
        Ticket.severity,
        func.count(Ticket.id)
    ).group_by(Ticket.severity).all()

    tickets_by_severity = {
        row[0].value: row[1] for row in severity_rows
    }

    #  Tickets by Tier
    tier_rows = db.query(
        Ticket.tier,
        func.count(Ticket.id)
    ).group_by(Ticket.tier).all()

    tickets_by_tier = {
        row[0].value: row[1] for row in tier_rows
    }

    #  Guardrail activations
    guardrail_hits = db.query(func.count(GuardRails.id)) \
        .filter(GuardRails.blocked == True) \
        .scalar()

    #  Escalations
    escalation_count = db.query(func.count(ChatMessages.id)) \
        .filter(ChatMessages.need_escalation == True) \
        .scalar()

    #  Conversation volumes
    total_sessions = db.query(func.count(ChatSessions.id)).scalar()

    total_messages = db.query(func.count(ChatMessages.id)).scalar()

    #  Deflection rate
    deflection_rate = 0
    if total_sessions:
        sessions_with_tickets = db.query(func.count(func.distinct(Ticket.session_id))).scalar()
        deflected_sessions = total_sessions - sessions_with_tickets
        deflection_rate = round(deflected_sessions / total_sessions, 3)

    return {
        "totalTickets": total_tickets,
        "openTickets": open_tickets,
        "closedTickets": closed_tickets,
        "ticketsBySeverity": tickets_by_severity,
        "ticketsByTier": tickets_by_tier,
        "guardrailActivations": guardrail_hits,
        "escalations": escalation_count,
        "conversationVolumes": {
            "sessions": total_sessions,
            "messages": total_messages,
        },
        "deflectionRate": deflection_rate,
    }



def metrics_trends(db, days: int = 7):

    since = datetime.utcnow() - timedelta(days=days)

    tickets_trend = db.query(
        func.date(Ticket.created_at),
        func.count(Ticket.id)
    ).filter(Ticket.created_at >= since) \
     .group_by(func.date(Ticket.created_at)) \
     .all()

    guardrail_trend = db.query(
        func.date(GuardRails.created_at),
        func.count(GuardRails.id)
    ).filter(GuardRails.created_at >= since) \
     .group_by(func.date(GuardRails.created_at)) \
     .all()

    escalation_trend = db.query(
        func.date(ChatMessages.created_at),
        func.count(ChatMessages.id)
    ).filter(
        ChatMessages.created_at >= since,
        ChatMessages.need_escalation == True
    ).group_by(func.date(ChatMessages.created_at)) \
     .all()
    
    sessions_trend = db.query(
        func.date(ChatSessions.created_at),
        func.count(ChatSessions.id)
    ).filter(ChatSessions.created_at >= since) \
     .group_by(func.date(ChatSessions.created_at)) \
     .all()

    messages_trend = db.query(
        func.date(ChatMessages.created_at),
        func.count(ChatMessages.id)
    ).filter(ChatMessages.created_at >= since) \
     .group_by(func.date(ChatMessages.created_at)) \
     .all()
    
    category_trend_rows = db.query(
        func.date(Ticket.created_at),
        func.jsonb_extract_path_text(Ticket.ai_results, 'category').label("category"),
        func.count(Ticket.id)
    ).filter(
        Ticket.created_at >= since,
        Ticket.ai_results.isnot(None)
    ).group_by(
        func.date(Ticket.created_at),
        "category"
    ).all()

    category_trend_map = defaultdict(lambda: defaultdict(int))

    for date, category, count in category_trend_rows:
        if category:
            category_trend_map[str(date)][category] = count

    category_trend = [
        {
            "date": date,
            "categories": dict(categories)
        }
        for date, categories in category_trend_map.items()
    ]

    return {
        "tickets": [{"date": str(row[0]), "count": row[1]} for row in tickets_trend],
        "guardrails": [{"date": str(row[0]), "count": row[1]} for row in guardrail_trend],
        "escalations": [{"date": str(row[0]), "count": row[1]} for row in escalation_trend],
        "conversationVolumes": {
            "sessions": [{"date": str(row[0]), "count": row[1]} for row in sessions_trend],
            "messages": [{"date": str(row[0]), "count": row[1]} for row in messages_trend],
        },

        "issueCategories": category_trend
    }