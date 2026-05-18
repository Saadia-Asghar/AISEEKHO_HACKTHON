"""Clerk user verification for backend sync."""

import os
from typing import Any

import httpx


def clerk_configured() -> bool:
    return bool(os.getenv("CLERK_SECRET_KEY"))


def fetch_clerk_user(clerk_user_id: str) -> dict[str, Any] | None:
    secret = os.getenv("CLERK_SECRET_KEY")
    if not secret:
        return None
    try:
        with httpx.Client(timeout=10.0) as client:
            r = client.get(
                f"https://api.clerk.com/v1/users/{clerk_user_id}",
                headers={"Authorization": f"Bearer {secret}"},
            )
            if r.status_code != 200:
                return None
            user = r.json()
            phones = user.get("phone_numbers") or []
            primary_phone = phones[0].get("phone_number") if phones else None
            emails = user.get("email_addresses") or []
            email = emails[0].get("email_address") if emails else None
            name = " ".join(
                filter(None, [user.get("first_name"), user.get("last_name")])
            ).strip() or (email or "KhidmatAI User")
            return {
                "clerk_user_id": clerk_user_id,
                "display_name": name,
                "phone": primary_phone,
                "email": email,
            }
    except Exception:
        return None


def verify_bearer_token(authorization: str | None) -> dict[str, Any] | None:
    """Best-effort: extract user id from Clerk session JWT sub claim (dev) or skip."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return None
    # Without full JWKS validation, rely on /auth/sync with clerk_user_id from trusted client
    # when secret is configured, sync endpoint validates user via fetch_clerk_user
    return {"session_token": token}
