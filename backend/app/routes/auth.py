from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.init_db import get_db
from app.models.schemas import UserLogin, UserRegister, TokenResponse
from app.administration.auth import authenticate_user, register_user
from app.administration.security import create_access_token
from app.models.db import User
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
def register(request: UserRegister, db: Session = Depends(get_db)):

    existing = db.query(User).filter(User.username == request.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    user = register_user(db, request.username, request.password, request.role)

    return {"message": "User registered", "username": user.username}


@router.post("/login", response_model=TokenResponse)
def login(request: UserLogin, db: Session = Depends(get_db)):

    user = authenticate_user(db, request.username, request.password)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_id = str(uuid.uuid4()) 

    token = create_access_token({
        "sub": user.username,
        "user_id": user.id,
        "role": user.role,
        "session_id": session_id   
    })

    return TokenResponse(
        access_token=token,
        role=user.role,
        session_id=session_id
    )
