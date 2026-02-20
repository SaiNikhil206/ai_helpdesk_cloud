from app.models.db import User
from app.administration.security import hash_password, verify_password
import uuid

def register_user(db, username: str, password: str, role: str):

    user = User(
        id=str(uuid.uuid4()),
        username=username,
        password_hash=hash_password(password),
        role=role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(db, username: str, password: str):

    user = db.query(User).filter(User.username == username).first()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user
