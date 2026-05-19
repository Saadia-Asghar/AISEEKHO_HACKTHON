"""OTP auth and user profiles."""

import logging
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Any

from app.db.database import _connect
from app.services.otp_sms import GUEST_PHONE, normalize_pk_phone, send_otp_sms, twilio_configured

logger = logging.getLogger(__name__)

MOCK_OTP = "1234"
OTP_TTL_MINUTES = 10


def init_auth_tables() -> None:
    with _connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS otp_codes (
                phone TEXT PRIMARY KEY,
                code TEXT NOT NULL,
                expires_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS auth_tokens (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )
        cols = {r[1] for r in conn.execute("PRAGMA table_info(users)").fetchall()}
        for col, typedef in [
            ("location", "TEXT"),
            ("language_pref", "TEXT DEFAULT 'ur'"),
            ("auth_token", "TEXT"),
        ]:
            if col not in cols:
                conn.execute(f"ALTER TABLE users ADD COLUMN {col} {typedef}")


def _generate_otp() -> str:
    return f"{secrets.randbelow(9000) + 1000:04d}"


def _otp_expires_at() -> str:
    return (datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES)).isoformat() + "Z"


def _is_expired(expires_at: str) -> bool:
    try:
        exp = expires_at.replace("Z", "+00:00")
        return datetime.fromisoformat(exp) < datetime.now(datetime.utcnow().astimezone().tzinfo)
    except Exception:
        return True


def send_otp(phone: str) -> dict[str, Any]:
    phone = normalize_pk_phone(phone)
    use_twilio = twilio_configured() and phone != GUEST_PHONE

    if phone == GUEST_PHONE:
        code = MOCK_OTP
    elif use_twilio:
        code = _generate_otp()
    else:
        code = MOCK_OTP

    expires = _otp_expires_at()
    with _connect() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)",
            (phone, code, expires),
        )

    if use_twilio:
        sms = send_otp_sms(phone, code)
        if sms.get("ok"):
            return {
                "phone": phone,
                "message": "Verification code sent by SMS",
                "twilio": True,
                "sms_sent": True,
                "demo_mode": False,
            }
        logger.warning("Twilio OTP failed, falling back to demo code for %s: %s", phone, sms.get("error"))

    return {
        "phone": phone,
        "message": "Demo OTP — use code 1234 (configure Twilio in backend/.env for real SMS)",
        "demo_otp": MOCK_OTP,
        "twilio": False,
        "sms_sent": False,
        "demo_mode": True,
    }


def _validate_otp(phone: str, otp: str) -> None:
    otp = otp.strip()
    if not otp.isdigit() or len(otp) != 4:
        raise ValueError("Enter the 4-digit code from your SMS")

    # Judge / hackathon guest account
    if phone == GUEST_PHONE:
        if otp != MOCK_OTP:
            raise ValueError("Invalid guest code")
        return

    with _connect() as conn:
        row = conn.execute(
            "SELECT code, expires_at FROM otp_codes WHERE phone = ?",
            (phone,),
        ).fetchone()

    if twilio_configured():
        if not row:
            raise ValueError("No OTP found — tap Send OTP again")
        if _is_expired(row["expires_at"]):
            raise ValueError("OTP expired — request a new code")
        if row["code"] != otp:
            raise ValueError("Incorrect code — check your SMS and try again")
        return

    # Demo mode (no Twilio): fixed 1234 or any 4 digits for local testing
    if otp == MOCK_OTP or otp.isdigit():
        return
    raise ValueError("Invalid OTP — use 1234 in demo mode")


def verify_otp(phone: str, otp: str, name: str | None = None) -> dict[str, Any]:
    phone = normalize_pk_phone(phone)
    _validate_otp(phone, otp)

    with _connect() as conn:
        row = conn.execute("SELECT id, display_name FROM users WHERE phone = ?", (phone,)).fetchone()
        if row:
            user_id = row["id"]
            display_name = name or row["display_name"]
            conn.execute("UPDATE users SET display_name = ? WHERE id = ?", (display_name, user_id))
        else:
            user_id = f"USR-{uuid.uuid4().hex[:12]}"
            display_name = name or "HazirAI User"
            created = datetime.utcnow().isoformat() + "Z"
            conn.execute(
                """
                INSERT INTO users (id, display_name, phone, created_at, language_pref)
                VALUES (?, ?, ?, ?, 'ur')
                """,
                (user_id, display_name, phone, created),
            )

        token = secrets.token_urlsafe(32)
        conn.execute(
            "INSERT INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?)",
            (token, user_id, datetime.utcnow().isoformat() + "Z"),
        )
        conn.execute("DELETE FROM otp_codes WHERE phone = ?", (phone,))

    profile = get_user_profile(user_id)
    return {"token": token, "user_id": user_id, "user": profile}


def issue_token_for_user(user_id: str) -> str:
    """Issue a backend API token for an existing user (e.g. after Clerk sign-in)."""
    token = secrets.token_urlsafe(32)
    with _connect() as conn:
        conn.execute(
            "INSERT INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?)",
            (token, user_id, datetime.utcnow().isoformat() + "Z"),
        )
    return token


def get_user_by_token(token: str) -> str | None:
    with _connect() as conn:
        row = conn.execute("SELECT user_id FROM auth_tokens WHERE token = ?", (token,)).fetchone()
    return row["user_id"] if row else None


def get_user_profile(user_id: str) -> dict[str, Any]:
    with _connect() as conn:
        row = conn.execute(
            "SELECT id, display_name, phone, location, language_pref, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    if not row:
        raise ValueError("User not found")
    return {
        "user_id": row["id"],
        "name": row["display_name"],
        "phone": row["phone"],
        "location": row["location"],
        "language_pref": row["language_pref"] or "ur",
        "created_at": row["created_at"],
    }


def update_user_profile(user_id: str, **fields: Any) -> dict[str, Any]:
    with _connect() as conn:
        for key, val in fields.items():
            if val is None:
                continue
            col = "display_name" if key == "name" else key
            if col in ("display_name", "location", "language_pref"):
                conn.execute(f"UPDATE users SET {col} = ? WHERE id = ?", (val, user_id))
    return get_user_profile(user_id)
