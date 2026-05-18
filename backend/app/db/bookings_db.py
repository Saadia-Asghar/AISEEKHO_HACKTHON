"""Booking queries and cancel."""

import json
from datetime import datetime
from typing import Any

from app.db.database import _connect


def list_bookings(user_id: str, status_filter: str | None = None) -> list[dict[str, Any]]:
    with _connect() as conn:
        if status_filter == "upcoming":
            q = """
                SELECT * FROM bookings WHERE user_id = ?
                AND status IN ('CONFIRMED', 'PENDING_PAYMENT', 'REMINDER_SCHEDULED')
                ORDER BY created_at DESC
            """
            rows = conn.execute(q, (user_id,)).fetchall()
        elif status_filter == "past":
            q = """
                SELECT * FROM bookings WHERE user_id = ?
                AND status IN ('COMPLETED', 'CONFIRMED', 'REMINDER_SCHEDULED')
                AND payment_status = 'paid'
                ORDER BY created_at DESC LIMIT 50
            """
            rows = conn.execute(q, (user_id,)).fetchall()
        elif status_filter == "cancelled":
            rows = conn.execute(
                "SELECT * FROM bookings WHERE user_id = ? AND status = 'cancelled' ORDER BY created_at DESC",
                (user_id,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
                (user_id,),
            ).fetchall()

    return [_booking_row(r) for r in rows]


def cancel_booking(booking_id: str, user_id: str | None = None) -> dict[str, Any]:
    with _connect() as conn:
        row = conn.execute("SELECT id, user_id, status FROM bookings WHERE id = ?", (booking_id,)).fetchone()
        if not row:
            raise ValueError("Booking not found")
        if user_id and row["user_id"] and row["user_id"] != user_id:
            raise ValueError("Not your booking")
        if row["status"] == "cancelled":
            return {"booking_id": booking_id, "status": "cancelled"}
        conn.execute(
            "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
            (booking_id,),
        )
    return {"booking_id": booking_id, "status": "cancelled"}


def count_upcoming(user_id: str) -> int:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT COUNT(*) as c FROM bookings WHERE user_id = ?
            AND status IN ('CONFIRMED', 'PENDING_PAYMENT', 'REMINDER_SCHEDULED')
            AND status != 'cancelled'
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
