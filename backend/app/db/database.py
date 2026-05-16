import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "orchestrator.db"


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS bookings (
                id TEXT PRIMARY KEY,
                session_id TEXT,
                customer_name TEXT,
                provider_id TEXT,
                provider_name TEXT,
                service_type TEXT,
                location TEXT,
                slot TEXT,
                slot_datetime TEXT,
                status TEXT,
                confirmation_message TEXT,
                receipt TEXT,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS follow_ups (
                id TEXT PRIMARY KEY,
                booking_id TEXT,
                reminder_time TEXT,
                completion_check_time TEXT,
                status TEXT,
                message TEXT,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS agent_traces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                trace_json TEXT,
                summary_json TEXT,
                created_at TEXT
            );
            """
        )
        cols = {r[1] for r in conn.execute("PRAGMA table_info(bookings)").fetchall()}
        if "customer_name" not in cols:
            conn.execute("ALTER TABLE bookings ADD COLUMN customer_name TEXT DEFAULT 'Demo Customer'")
        if "receipt" not in cols:
            conn.execute("ALTER TABLE bookings ADD COLUMN receipt TEXT")
        if "slot_datetime" not in cols:
            conn.execute("ALTER TABLE bookings ADD COLUMN slot_datetime TEXT")
        trace_cols = {r[1] for r in conn.execute("PRAGMA table_info(agent_traces)").fetchall()}
        if "summary_json" not in trace_cols:
            conn.execute("ALTER TABLE agent_traces ADD COLUMN summary_json TEXT")
        fu_cols = {r[1] for r in conn.execute("PRAGMA table_info(follow_ups)").fetchall()}
        if "completion_check_time" not in fu_cols:
            conn.execute("ALTER TABLE follow_ups ADD COLUMN completion_check_time TEXT")


def next_booking_id() -> str:
    today = datetime.utcnow().strftime("%Y%m%d")
    prefix = f"KHI-{today}-"
    with _connect() as conn:
        row = conn.execute(
            "SELECT COUNT(*) as c FROM bookings WHERE id LIKE ?",
            (f"{prefix}%",),
        ).fetchone()
        seq = (row["c"] or 0) + 1
    return f"{prefix}{seq:03d}"


def save_booking(
    session_id: str,
    customer_name: str,
    provider_id: str,
    provider_name: str,
    service_type: str,
    location: str,
    slot: str,
    slot_datetime: str,
    confirmation_message: str,
    receipt: str,
) -> dict[str, Any]:
    booking_id = next_booking_id()
    created = datetime.utcnow().isoformat() + "Z"
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO bookings
            (id, session_id, customer_name, provider_id, provider_name, service_type,
             location, slot, slot_datetime, status, confirmation_message, receipt, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                booking_id,
                session_id,
                customer_name,
                provider_id,
                provider_name,
                service_type,
                location,
                slot,
                slot_datetime,
                "CONFIRMED",
                confirmation_message,
                receipt,
                created,
            ),
        )
    return {
        "booking_id": booking_id,
        "customer_name": customer_name,
        "provider_id": provider_id,
        "provider_name": provider_name,
        "service_type": service_type,
        "location": location,
        "slot": slot,
        "slot_datetime": slot_datetime,
        "status": "CONFIRMED",
        "confirmation_message": confirmation_message,
        "receipt": receipt,
    }


def save_follow_up(
    booking_id: str,
    reminder_time: str,
    completion_check_time: str,
    message: str,
) -> dict[str, Any]:
    follow_id = f"FU-{booking_id}"
    created = datetime.utcnow().isoformat() + "Z"
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO follow_ups (id, booking_id, reminder_time, completion_check_time, status, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (follow_id, booking_id, reminder_time, completion_check_time, "REMINDER_SCHEDULED", message, created),
        )
        conn.execute("UPDATE bookings SET status = ? WHERE id = ?", ("REMINDER_SCHEDULED", booking_id))
    return {
        "reminder_scheduled": True,
        "reminder_time": reminder_time,
        "completion_check_time": completion_check_time,
        "status_update": message,
        "booking_status": "REMINDER_SCHEDULED",
    }


def save_trace(session_id: str, trace: list[dict[str, Any]], summary: dict[str, Any]) -> None:
    with _connect() as conn:
        conn.execute(
            "INSERT INTO agent_traces (session_id, trace_json, summary_json, created_at) VALUES (?, ?, ?, ?)",
            (session_id, json.dumps(trace), json.dumps(summary), datetime.utcnow().isoformat() + "Z"),
        )


def get_trace(session_id: str) -> dict[str, Any] | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT trace_json, summary_json FROM agent_traces WHERE session_id = ? ORDER BY id DESC LIMIT 1",
            (session_id,),
        ).fetchone()
    if not row:
        return None
    return {
        "trace": json.loads(row["trace_json"]),
        "summary": json.loads(row["summary_json"]) if row["summary_json"] else None,
    }


def reminder_time_for_slot(slot: str) -> str:
    hour = int(slot.split(":")[0])
    reminder = datetime.utcnow().replace(hour=max(hour - 1, 0), minute=0, second=0, microsecond=0)
    return reminder.strftime("%Y-%m-%d %H:%M UTC")


def completion_check_for_slot(slot: str) -> str:
    hour, minute = map(int, slot.split(":"))
    check = datetime.utcnow().replace(hour=hour, minute=minute, second=0, microsecond=0)
    check += timedelta(hours=1, minutes=30)
    return check.strftime("%Y-%m-%d %H:%M UTC")
