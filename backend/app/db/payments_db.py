"""Payment persistence."""

import json
from datetime import datetime
from typing import Any

from app.db.database import _connect


def save_payment(
    payment_id: str,
    booking_id: str,
    user_id: str | None,
    amount_pkr: int,
    method: str,
    status: str,
    stripe_payment_intent_id: str | None = None,
) -> None:
    created = datetime.utcnow().isoformat() + "Z"
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO payments
            (id, booking_id, user_id, amount_pkr, method, status, stripe_payment_intent_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (payment_id, booking_id, user_id, amount_pkr, method, status, stripe_payment_intent_id, created),
        )


def mark_payment_paid(payment_id: str) -> None:
    paid = datetime.utcnow().isoformat() + "Z"
    with _connect() as conn:
        conn.execute(
            "UPDATE payments SET status = 'paid', paid_at = ? WHERE id = ?",
            (paid, payment_id),
        )


def update_booking_payment(booking_id: str, status: str, amount_pkr: int) -> None:
    with _connect() as conn:
        conn.execute(
            "UPDATE bookings SET payment_status = ?, amount_pkr = ?, status = ? WHERE id = ?",
            (status, amount_pkr, "CONFIRMED" if status == "paid" else "PENDING_PAYMENT", booking_id),
        )


def log_notification(booking_id: str, result: dict[str, Any]) -> None:
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO notification_log (booking_id, channel, recipient, status, payload, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                booking_id,
                result.get("channel", "unknown"),
                result.get("to", ""),
                result.get("status", "unknown"),
                json.dumps(result),
                datetime.utcnow().isoformat() + "Z",
            ),
        )


def get_payment_by_booking(booking_id: str) -> dict[str, Any] | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1",
            (booking_id,),
        ).fetchone()
    return dict(row) if row else None
