"""Payment confirmation and notifications."""

from app.db.database import init_db
from app.db import payments_db
from app.orchestrator import KhidmatOrchestrator
from app.services import notifications as notify


def test_payment_confirm_sends_notifications():
    init_db()
    o = KhidmatOrchestrator()
    r = o.run("Mujhe kal subah G-13 mein AC technician chahiye", user_lat=33.6842, user_lng=72.9784)
    assert r.user_location is not None
    assert r.user_location.source == "gps"

    from app.services.payments import confirm_payment

    confirm_payment(r.payment.payment_id, r.booking.booking_id, "jazzcash")
    payments_db.mark_payment_paid(r.payment.payment_id)
    payments_db.update_booking_payment(r.booking.booking_id, "paid", r.payment.amount_pkr)

    results = notify.send_booking_notifications(
        "+923001112233",
        r.recommended.phone,
        r.booking.booking_id,
        r.recommended.name,
        r.booking.slot,
        r.intent.location,
    )
    assert len(results) >= 2
    assert all(r["status"] in ("simulated", "sent") for r in results)
