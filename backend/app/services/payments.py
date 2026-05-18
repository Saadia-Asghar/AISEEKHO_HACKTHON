"""Payments: Stripe (test/live) or simulated JazzCash / Easypaisa / card."""

import logging
import os
import uuid
from typing import Any

logger = logging.getLogger(__name__)

SERVICE_BASE_PKR: dict[str, int] = {
    "ac_technician": 2500,
    "plumber": 1800,
    "electrician": 2000,
    "tutor": 1500,
    "beautician": 2200,
    "carpenter": 1900,
    "painter": 2100,
    "general": 1500,
}


def estimate_cost_pkr(service_type: str) -> int:
    return SERVICE_BASE_PKR.get(service_type, SERVICE_BASE_PKR["general"])


def create_payment(
    booking_id: str,
    amount_pkr: int,
    method: str = "card",
    user_id: str | None = None,
) -> dict[str, Any]:
    payment_id = f"PAY-{uuid.uuid4().hex[:10].upper()}"
    stripe_key = os.getenv("STRIPE_SECRET_KEY")

    if stripe_key and method == "card":
        try:
            import stripe

            stripe.api_key = stripe_key
            # Stripe uses smallest currency unit (paisa for PKR if supported; USD cents fallback)
            intent = stripe.PaymentIntent.create(
                amount=amount_pkr * 100,
                currency=os.getenv("STRIPE_CURRENCY", "pkr"),
                metadata={"booking_id": booking_id, "user_id": user_id or ""},
                automatic_payment_methods={"enabled": True},
            )
            return {
                "payment_id": payment_id,
                "booking_id": booking_id,
                "amount_pkr": amount_pkr,
                "method": method,
                "status": "requires_confirmation",
                "stripe_client_secret": intent.client_secret,
                "stripe_payment_intent_id": intent.id,
            }
        except Exception as e:
            logger.warning("Stripe intent failed: %s", e)

    # Simulated local wallets + card
    return {
        "payment_id": payment_id,
        "booking_id": booking_id,
        "amount_pkr": amount_pkr,
        "method": method,
        "status": "pending",
        "simulated": True,
        "instructions": _wallet_instructions(method, amount_pkr, payment_id),
    }


def _wallet_instructions(method: str, amount: int, payment_id: str) -> str:
    if method == "jazzcash":
        return f"JazzCash: Send PKR {amount} to KhidmatAI Merchant. Ref: {payment_id}"
    if method == "easypaisa":
        return f"Easypaisa: Send PKR {amount}. Ref: {payment_id}"
    return f"Demo payment PKR {amount}. Ref: {payment_id}"


def confirm_payment(
    payment_id: str,
    booking_id: str,
    method: str,
    stripe_payment_intent_id: str | None = None,
) -> dict[str, Any]:
    stripe_key = os.getenv("STRIPE_SECRET_KEY")
    if stripe_key and stripe_payment_intent_id:
        try:
            import stripe

            stripe.api_key = stripe_key
            intent = stripe.PaymentIntent.retrieve(stripe_payment_intent_id)
            if intent.status not in ("succeeded", "processing"):
                return {"payment_id": payment_id, "status": intent.status, "paid": False}
        except Exception as e:
            logger.warning("Stripe confirm check: %s", e)

    logger.info("[PAYMENT] Confirmed %s for booking %s via %s", payment_id, booking_id, method)
    return {
        "payment_id": payment_id,
        "booking_id": booking_id,
        "method": method,
        "status": "paid",
        "paid": True,
    }
