from fastapi import APIRouter, Depends
from services.memory import get_or_create_session
from models.schemas import ChatRequest, ChatResponse
from services.rag import ask_question
from sqlalchemy.orm import Session
from models.db import User
from fastapi import HTTPException
from init_db import get_db
from administration.dependencies import get_current_user


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