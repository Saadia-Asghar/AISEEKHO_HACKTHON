from fastapi import APIRouter, HTTPException

from app.db import auth_db, user_data
from app.models.schemas import SyncClerkRequest
from app.services.clerk_auth import clerk_configured, fetch_clerk_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/sync")
def sync_clerk_user(body: SyncClerkRequest):
    """Link Clerk account to KhidmatAI user profile (phone OTP / OAuth via Clerk)."""
    if clerk_configured():
        verified = fetch_clerk_user(body.clerk_user_id)
        if not verified:
            raise HTTPException(status_code=401, detail="Invalid Clerk user")
        display_name = verified.get("display_name") or body.display_name
        phone = verified.get("phone") or body.phone
    else:
        display_name = body.display_name
        phone = body.phone

    user = user_data.sync_clerk_user(body.clerk_user_id, display_name, phone)
    user_id = user["user_id"]
    token = auth_db.issue_token_for_user(user_id)
    profile = auth_db.get_user_profile(user_id)
    return {
        "user_id": user_id,
        "token": token,
        "name": profile["name"],
        "phone": profile.get("phone") or phone,
        "user": profile,
        "clerk_id": body.clerk_user_id,
    }
