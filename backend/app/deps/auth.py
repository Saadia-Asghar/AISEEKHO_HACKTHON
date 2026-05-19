"""Bearer token validation for API routes."""

from fastapi import Header, HTTPException

from app.db import auth_db


def require_user_id(authorization: str | None = Header(None, alias="Authorization")) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")
    token = authorization.removeprefix("Bearer ").strip()
    user_id = auth_db.get_user_by_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user_id


def optional_user_id(authorization: str | None = Header(None, alias="Authorization")) -> str | None:
    """Invalid/expired Bearer is ignored (returns None) so discover still works for demo."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    return auth_db.get_user_by_token(token)
