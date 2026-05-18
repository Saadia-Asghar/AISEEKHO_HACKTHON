"""End-to-end pipeline tests for KhidmatAI demo scenarios."""

from app.db.database import init_db
from app.orchestrator import KhidmatOrchestrator


def _run(message: str):
    init_db()
    return KhidmatOrchestrator().run(message)


def test_demo_ac_g13():
    r = _run("Mujhe kal subah G-13 mein AC technician chahiye")
    assert r.intent.service_label == "AC Technician"
    assert r.intent.location == "G-13"
    assert "Ali" in r.recommended.name
    assert r.booking.booking_id.startswith("KHI-")
    assert r.booking.slot == "10:00"
    assert r.payment.amount_pkr > 0
    assert r.booking.payment_status == "pending"
    assert len(r.trace) >= 6


def test_plumber_f7_urgent():
    r = _run("I need a plumber in F-7 urgently")
    assert r.intent.service_label == "Plumber"
    assert r.intent.urgency is True
    assert r.recommended.distance_km <= 10


def test_electrician_dha():
    r = _run("Electrician in DHA Phase 9 right now")
    assert r.intent.service_label == "Electrician"
    assert r.recommended.area == "DHA" or r.recommended.distance_km <= 15


def test_tutor_i8():
    r = _run("مجھے ایک میتھ کا ٹیوٹر چاہیے ایٹھویں میں")
    assert r.intent.service_label == "Home Tutor"
    assert r.intent.location == "I-8"
