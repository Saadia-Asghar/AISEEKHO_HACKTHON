"""User ratings, saved workers, and personalized ranking."""

from app.db.database import init_db
from app.db import user_data
from app.orchestrator import KhidmatOrchestrator


def test_rating_and_saved_boost():
    init_db()
    user = user_data.create_user("Test User")
    uid = user["user_id"]

    o = KhidmatOrchestrator()
    r1 = o.run("Mujhe kal subah G-13 mein AC technician chahiye", customer_name="Test", user_id=uid)
    bid = r1.booking.booking_id
    pid = r1.recommended.id

    user_data.submit_rating(uid, pid, bid, 5, "Great service")
    user_data.save_provider(uid, pid)

    r2 = o.run("Mujhe kal subah G-13 mein AC technician chahiye", customer_name="Test", user_id=uid)
    assert r2.recommended.is_saved or r2.personalization is not None
    assert r2.recommended.effective_rating is not None

    saved = user_data.list_saved_providers(uid)
    assert any(s["id"] == pid for s in saved)

    bookings = user_data.list_user_bookings(uid)
    assert any(b["booking_id"] == bid and b["rated"] for b in bookings)
