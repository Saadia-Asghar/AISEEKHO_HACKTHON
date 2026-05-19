"""Booking queries, cancel, and reschedule."""

import re
from datetime import datetime, timedelta
from typing import Any

from app.db.booking_status import can_transition, normalize_status, transition
from app.db.database import _connect


def list_bookings(user_id: str, status_filter: str | None = None) -> list[dict[str, Any]]:
    with _connect() as conn:
        if status_filter == "upcoming":
            q = """
                SELECT * FROM bookings WHERE user_id = ?
                AND UPPER(status) IN ('CONFIRMED', 'PENDING', 'PENDING_PAYMENT', 'REMINDER_SCHEDULED', 'IN_PROGRESS')
                AND UPPER(status) != 'CANCELLED'
                ORDER BY created_at DESC
            """
            rows = conn.execute(q, (user_id,)).fetchall()
        elif status_filter == "past":
            q = """
                SELECT * FROM bookings WHERE user_id = ?
                AND UPPER(status) = 'COMPLETED'
                ORDER BY created_at DESC LIMIT 50
            """
            rows = conn.execute(q, (user_id,)).fetchall()
        elif status_filter == "cancelled":
            rows = conn.execute(
                "SELECT * FROM bookings WHERE user_id = ? AND UPPER(status) = 'CANCELLED' ORDER BY created_at DESC",
                (user_id,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
                (user_id,),
            ).fetchall()

    return [_booking_row(r) for r in rows]


_SLOT_RE = re.compile(r"^\d{2}:\d{2}$")


def _slot_datetime_for(when: str, slot: str) -> str:
    base = datetime.utcnow()
    if (when or "tomorrow").lower() == "tomorrow":
        base += timedelta(days=1)
    hour, minute = map(int, slot.split(":"))
    return base.replace(hour=hour, minute=minute, second=0, microsecond=0).isoformat() + "Z"


def reschedule_booking(
    booking_id: str,
    slot: str,
    user_id: str | None = None,
    when: str = "tomorrow",
) -> dict[str, Any]:
    slot = slot.strip()
    if not _SLOT_RE.match(slot):
        raise ValueError("Invalid time slot (use HH:MM)")

    with _connect() as conn:
        row = conn.execute(
            "SELECT id, user_id, status, provider_name, service_type, location FROM bookings WHERE id = ?",
            (booking_id,),
        ).fetchone()
        if not row:
            raise ValueError("Booking not found")
        if user_id and row["user_id"] and row["user_id"] != user_id:
            raise ValueError("Not your booking")
        status = normalize_status(row["status"])
        if status in ("CANCELLED", "COMPLETED"):
            raise ValueError("Cannot reschedule a cancelled or completed booking")

        slot_datetime = _slot_datetime_for(when, slot)
        when_label = "tomorrow" if (when or "").lower() == "tomorrow" else "today"
        message = (
            f"Rescheduled with {row['provider_name']} for {row['service_type']} "
            f"at {row['location']} — {when_label} {slot}."
        )
        conn.execute(
            """
            UPDATE bookings
            SET slot = ?, slot_datetime = ?, confirmation_message = ?
            WHERE id = ?
            """,
            (slot, slot_datetime, message, booking_id),
        )

    return {
        "booking_id": booking_id,
        "slot": slot,
        "slot_datetime": slot_datetime,
        "when": when_label,
        "status": status,
        "message": message,
    }


def cancel_booking(booking_id: str, user_id: str | None = None) -> dict[str, Any]:
    with _connect() as conn:
        row = conn.execute("SELECT id, user_id, status FROM bookings WHERE id = ?", (booking_id,)).fetchone()
        if not row:
            raise ValueError("Booking not found")
        if user_id and row["user_id"] and row["user_id"] != user_id:
            raise ValueError("Not your booking")
        new_status = transition(row["status"], "CANCELLED")
        conn.execute("UPDATE bookings SET status = ? WHERE id = ?", (new_status, booking_id))
    return {"booking_id": booking_id, "status": "CANCELLED"}


def confirm_booking(booking_id: str) -> dict[str, Any]:
    with _connect() as conn:
        row = conn.execute("SELECT status FROM bookings WHERE id = ?", (booking_id,)).fetchone()
        if not row:
            raise ValueError("Booking not found")
        new_status = transition(row["status"], "CONFIRMED")
        conn.execute(
            "UPDATE bookings SET status = ?, payment_status = 'paid' WHERE id = ?",
            (new_status, booking_id),
        )
    return {"booking_id": booking_id, "status": "CONFIRMED"}


def start_booking(booking_id: str) -> dict[str, Any]:
    """Mark worker as on the way (demo lifecycle)."""
    with _connect() as conn:
        row = conn.execute("SELECT status FROM bookings WHERE id = ?", (booking_id,)).fetchone()
        if not row:
            raise ValueError("Booking not found")
        cur = normalize_status(row["status"])
        if cur == "CONFIRMED":
            new_status = transition(cur, "IN_PROGRESS")
        else:
            new_status = transition(cur, "IN_PROGRESS") if can_transition(cur, "IN_PROGRESS") else cur
        conn.execute("UPDATE bookings SET status = ? WHERE id = ?", (new_status, booking_id))
    return {"booking_id": booking_id, "status": "IN_PROGRESS"}


def complete_booking(booking_id: str) -> dict[str, Any]:
    with _connect() as conn:
        row = conn.execute("SELECT status FROM bookings WHERE id = ?", (booking_id,)).fetchone()
        if not row:
            raise ValueError("Booking not found")
        new_status = transition(row["status"], "COMPLETED")
        conn.execute("UPDATE bookings SET status = ? WHERE id = ?", (new_status, booking_id))
    return {"booking_id": booking_id, "status": "COMPLETED"}


def count_upcoming(user_id: str) -> int:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT COUNT(*) as c FROM bookings WHERE user_id = ?
            AND UPPER(status) IN ('CONFIRMED', 'PENDING', 'PENDING_PAYMENT', 'REMINDER_SCHEDULED')
            AND UPPER(status) != 'CANCELLED'
            """,
            (user_id,),
        ).fetchone()
    return int(row["c"] or 0)


def _booking_row(row) -> dict[str, Any]:
    return {
        "booking_id": row["id"],
        "provider_id": row["provider_id"],
        "provider_name": row["provider_name"],
        "service_type": row["service_type"],
        "location": row["location"],
        "slot": row["slot"],
        "slot_datetime": row["slot_datetime"] if "slot_datetime" in row.keys() else None,
        "status": row["status"],
        "payment_status": row["payment_status"] if "payment_status" in row.keys() else None,
        "amount_pkr": row["amount_pkr"] if "amount_pkr" in row.keys() else None,
        "created_at": row["created_at"],
    }
