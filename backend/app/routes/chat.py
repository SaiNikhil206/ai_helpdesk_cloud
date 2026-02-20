from fastapi import APIRouter, Depends
from app.services.memory import get_or_create_session
from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag import ask_question
from sqlalchemy.orm import Session
from app.models.db import User
from fastapi import HTTPException
from app.init_db import get_db
from app.administration.dependencies import get_current_user


router = APIRouter(
    prefix="/api",
    tags=["chat"],
)

@router.post("/chat", response_model=ChatResponse)
def chat_post(
    request: ChatRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
    
):
    request.session_id = user["session_id"]
    request.user_role = user["role"]

    db_user = db.query(User).filter(
        User.username == user["username"]
    ).first()

    if not db_user:
        raise HTTPException(404, "User not found")

    session = get_or_create_session(
        db=db,
        session_id=user["session_id"],
        user_id=db_user.id, 
        user_role=user["role"],
        context=request.context
    )
    
    return ask_question(request, db)