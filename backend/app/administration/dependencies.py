from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os

security = HTTPBearer()

SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret")
ALGORITHM = "HS256"


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):

    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        username = payload.get("sub")
        role = payload.get("role")
        session_id = payload.get("session_id")
        user_id = payload.get("user_id")

        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")

        return {
            "username": username,
            "role": role,
            "session_id": session_id,
            "user_id": user_id
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
