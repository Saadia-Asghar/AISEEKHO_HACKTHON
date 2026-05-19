import pytest
from fastapi.testclient import TestClient

from app.db.database import init_db
from app.main import app
from app.models.schemas import PaymentCredentials
from app.services.payments import process_payment_credentials


def test_process_card_credentials():
    auth = process_payment_credentials(
        "card",
        PaymentCredentials(
            card_number="4111111111111111",
            cardholder_name="Ali Khan",
            expiry="12/30",
            cvv="123",
        ),
        2500,
        "PAY-TEST",
    )
    assert auth["authorized"] is True
    assert auth["card_last4"] == "1111"


def test_process_wallet_credentials():
    auth = process_payment_credentials(
        "jazzcash",
        PaymentCredentials(phone="03001234567", pin="1234"),
        1800,
        "PAY-TEST",
    )
    assert auth["authorized"] is True
    assert "wallet_phone_masked" in auth


def test_process_card_accepts_any_valid_length_number():
    auth = process_payment_credentials(
        "card",
        PaymentCredentials(
            card_number="123456789012",
            cardholder_name="Test",
            expiry="12/30",
            cvv="123",
        ),
        1000,
        "PAY-X",
    )
    assert auth["authorized"] is True


def test_confirm_payment_api_requires_credentials():
    init_db()
    client = TestClient(app)
    o = __import__("app.orchestrator", fromlist=["KhidmatOrchestrator"]).KhidmatOrchestrator()
    r = o.run("I need a plumber in F-7 urgently", user_lat=33.72, user_lng=73.05)
    res = client.post(
        "/api/payments/confirm",
        json={
            "payment_id": r.payment.payment_id,
            "booking_id": r.booking.booking_id,
            "method": "card",
        },
    )
    assert res.status_code == 402

    ok = client.post(
        "/api/payments/confirm",
        json={
            "payment_id": r.payment.payment_id,
            "booking_id": r.booking.booking_id,
            "method": "card",
            "credentials": {
                "card_number": "4111111111111111",
                "cardholder_name": "Ali Khan",
                "expiry": "12/30",
                "cvv": "123",
            },
            "customer_phone": "+923001112233",
        },
    )
    assert ok.status_code == 200
    assert ok.json()["status"] == "CONFIRMED"
