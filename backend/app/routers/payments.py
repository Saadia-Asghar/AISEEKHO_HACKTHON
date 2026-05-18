import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.db import bookings_db, payments_db
from app.db.database import _connect
from app.models.schemas import ConfirmPaymentRequest, NotificationResult
from app.services import notifications as notify
from app.services.payments import confirm_payment

router = APIRouter(prefix="/api/payments", tags=["payments"])

PROVIDERS_PATH = Path(__file__).resolve().parent.parent / "data" / "providers.json"


@router.post("/confirm")
def confirm_booking_payment(body: ConfirmPaymentRequest):
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, provider_id, provider_name, location, slot, user_id, payment_status
            FROM bookings WHERE id = ?
            """,
            (body.booking_id,),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Booking not found")
    if row["payment_status"] == "paid":
        return {
            "payment": {"status": "paid", "booking_id": body.booking_id},
            "booking_id": body.booking_id,
            "status": "CONFIRMED",
            "notifications": [],
            "rate_booking": True,
            "already_paid": True,
        }

    with open(PROVIDERS_PATH, encoding="utf-8") as f:
        providers = {p["id"]: p for p in json.load(f)}
    provider_phone = providers.get(row["provider_id"], {}).get("phone", "+92-300-0000000")

    result = confirm_payment(
        body.payment_id,
        body.booking_id,
        body.method,
        body.stripe_payment_intent_id,
    )
    if not result.get("paid"):
        raise HTTPException(status_code=402, detail="Payment not completed")

    payments_db.mark_payment_paid(body.payment_id)
    pay_row = payments_db.get_payment_by_booking(body.booking_id)
    amount = int(pay_row["amount_pkr"]) if pay_row else 1500
    payments_db.update_booking_payment(body.booking_id, "paid", amount)
    bookings_db.confirm_booking(body.booking_id)

    notif_raw = notify.send_booking_notifications(
        body.customer_phone,
        provider_phone,
        body.booking_id,
        row["provider_name"],
        row["slot"],
        row["location"],
        body.notify_channels,
    )
    for n in notif_raw:
        payments_db.log_notification(body.booking_id, n)

    return {
        "payment": result,
        "booking_id": body.booking_id,
        "status": "CONFIRMED",
        "notifications": [NotificationResult(**n) for n in notif_raw],
        "rate_booking": True,
    }
