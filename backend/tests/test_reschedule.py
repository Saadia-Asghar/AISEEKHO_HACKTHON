from fastapi.testclient import TestClient

from app.db.database import init_db
from app.main import app
from app.orchestrator import KhidmatOrchestrator


def test_reschedule_booking():
    init_db()
    client = TestClient(app)
    o = KhidmatOrchestrator()
    r = o.run("I need a plumber in F-7 urgently", user_lat=33.72, user_lng=73.05)
    bid = r.booking.booking_id

    res = client.patch(
        f"/api/bookings/{bid}/reschedule",
        json={"slot": "14:00", "when": "tomorrow"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["slot"] == "14:00"

    with __import__("app.db.database", fromlist=["_connect"])._connect() as conn:
        row = conn.execute("SELECT slot FROM bookings WHERE id = ?", (bid,)).fetchone()
    assert row["slot"] == "14:00"
