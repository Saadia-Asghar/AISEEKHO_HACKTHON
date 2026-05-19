"""End-to-end pipeline tests for HazirAI demo scenarios."""

from app.db.database import init_db
from app.orchestrator import KhidmatOrchestrator


def _run(message: str):
    init_db()
    return KhidmatOrchestrator().run(message)


def test_demo_ac_g13():
    r = _run("Mujhe kal subah G-13 mein AC technician chahiye")
    assert r.intent.service_label == "AC Technician"
    assert r.intent.location == "G-13"
    assert r.recommended.category == "ac_technician"
    assert r.booking.booking_id.startswith("KHI-")
    assert r.booking.slot in ("09:00", "10:00", "11:00", "14:00", "16:00")
    assert r.payment.amount_pkr > 0
    assert r.booking.payment_status == "pending"
    assert len(r.trace) >= 5


def test_plumber_f7_urgent():
    r = _run("I need a plumber in F-7 urgently")
    assert r.intent.service_label == "Plumber"
    assert r.intent.urgency is True
    assert r.recommended.distance_km <= 10


def test_electrician_f7():
    r = _run("Electrician in F-7 right now")
    assert r.intent.service_label == "Electrician"
    assert r.intent.location == "F-7"
    assert r.recommended.distance_km <= 15


def test_cleaner_i8():
    r = _run("I need a cleaner in I-8 tomorrow")
    assert r.intent.service_label == "Cleaner"
    assert r.intent.location == "I-8"


def test_urdu_tutor_i8():
    r = _run("مجھے ایک میتھ کا ٹیوٹر چاہیے ایٹھویں میں")
    assert r.recommended.category == "tutor"
    assert r.intent.location == "I-8"


def test_electrician_dha_phase_9():
    # DHA has our newly added electrician (h41)
    r = _run("Electrician in DHA Phase 9 right now")
    assert r.intent.service_label == "Electrician"
    assert r.recommended.area == "DHA"
    assert r.recommended.distance_km <= 20

