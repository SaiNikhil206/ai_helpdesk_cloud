from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from app.init_db import get_db
from app.models.schemas import TicketCreate, TicketResponse, TicketUpdate
from app.models.db import Ticket, ChatSessions
from app.administration.dependencies import get_current_user
from fastapi import HTTPException, Query
from app.models.db import Ticket
import uuid

router = APIRouter(
    prefix="/api",
    tags=["tickets"]
)


@router.post("/tickets", response_model=TicketResponse)
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):

    new_ticket = Ticket(
        id=str(uuid.uuid4()),
        session_id=ticket.session_id,
        tier=ticket.tier,
        severity=ticket.severity,
        status="OPEN",
        user_role=ticket.user_role,
        ai_results=ticket.ai_results or {}
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return new_ticket

@router.get("/tickets", response_model=list[TicketResponse])
def list_tickets(
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    role = user["role"].lower()
    user_id = user["user_id"]

    query = db.query(Ticket).join(
        ChatSessions,
        Ticket.session_id == ChatSessions.id
    )

    if role == "admin":
        pass

    elif role == "support engineer":
        pass

    elif role == "instructor":
        query = query.filter(ChatSessions.user_id == user_id)


    elif role == "trainee":
        query = query.filter(ChatSessions.user_id == user_id)


    elif role == "operator":
        query = query.filter(Ticket.severity.in_(["HIGH", "CRITICAL"]))

    else:
        raise HTTPException(403, "Unauthorized role")

    if status:
        query = query.filter(Ticket.status == status)

    return query.all()


@router.put("/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: str,
    updates: TicketUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    role = user["role"].lower()
    current_user_id = user["user_id"]

    # ✅ Explicit join + fetch both objects
    result = db.query(Ticket, ChatSessions).join(
        ChatSessions,
        Ticket.session_id == ChatSessions.id
    ).filter(
        Ticket.id == ticket_id
    ).first()

    if not result:
        raise HTTPException(404, "Ticket not found")

    ticket, chat_session = result

    if role == "admin":
        pass

    elif role == "support engineer":
        pass

    elif role == "instructor":
        if chat_session.user_id != current_user_id:
            raise HTTPException(403, "Not allowed to update this ticket")

    elif role == "operator":
        if updates.tier:
            raise HTTPException(403, "Operator cannot change ticket tier")

    else:
        raise HTTPException(403, "Permission denied")


    if updates.status:
        ticket.status = updates.status

    if updates.tier:
        ticket.tier = updates.tier

    if updates.severity:
        ticket.severity = updates.severity

    db.commit()
    db.refresh(ticket)

    return ticket



@router.delete("/tickets/{ticket_id}")
def delete_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    role = user["role"].lower()

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(404, "Ticket not found")

    if role != "admin":
        raise HTTPException(403, "Only admin can delete tickets")

    db.delete(ticket)
    db.commit()

    return {"message": "Ticket deleted successfully"}

