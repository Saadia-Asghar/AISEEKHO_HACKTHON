"""OTP auth and user profiles."""

import secrets
import uuid
from datetime import datetime, timedelta
from typing import Any

from app.db.database import _connect

MOCK_OTP = "1234"


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


def send_otp(phone: str) -> dict[str, Any]:
    phone = phone.strip()
    expires = (datetime.utcnow() + timedelta(minutes=10)).isoformat() + "Z"
    with _connect() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)",
            (phone, MOCK_OTP, expires),
        )
    return {
        "phone": phone,
        "message": "OTP sent (demo: use 1234 or any 4-digit code)",
        "demo_otp": MOCK_OTP,
    }


def verify_otp(phone: str, otp: str, name: str | None = None) -> dict[str, Any]:
    phone = phone.strip()
    otp = otp.strip()
    if len(otp) == 4 and (otp == MOCK_OTP or otp.isdigit()):
        pass
    else:
        raise ValueError("Invalid OTP. Use 1234 in demo mode.")

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
    allowed = {"display_name": "name", "location": "location", "language_pref": "language_pref"}
    with _connect() as conn:
        for key, val in fields.items():
            if val is None:
                continue
            col = "display_name" if key == "name" else key
            if col in ("display_name", "location", "language_pref"):
                conn.execute(f"UPDATE users SET {col} = ? WHERE id = ?", (val, user_id))
    return get_user_profile(user_id)
