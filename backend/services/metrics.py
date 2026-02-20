from models.db import Ticket, GuardRails

def metrics_summary(db):

    total_tickets = db.query(Ticket).count()
    open_tickets = db.query(Ticket).filter(Ticket.status == "OPEN").count()
    closed_tickets = db.query(Ticket).filter(Ticket.status == "CLOSED").count()

    by_severity = {}
    for severity, in db.query(Ticket.severity).all():
        by_severity[severity] = by_severity.get(severity, 0) + 1

    guardrail_hits = db.query(GuardRails).filter(GuardRails.blocked == True).count()

    return {
        "totalTickets": total_tickets,
        "openTickets": open_tickets,
        "closedTickets": closed_tickets,
        "ticketsBySeverity": by_severity,
        "guardrailActivations": guardrail_hits,
    }
