from datetime import datetime, timedelta
from typing import Any

from app.agents.base import BaseAgent
from app.db import database
from app.models.schemas import AgentPhase, BookingResult, Provider
from app.services.payments import estimate_cost_pkr
from app.services.receipt import build_receipt


class BookingAgent(BaseAgent):
    name = "BookingAgent"
    phase = AgentPhase.ACTION

    def _pick_slot(self, provider: Provider, time_hint: str, urgency: bool) -> str:
        slots = provider.available_slots
        if not slots:
            return "10:00"
        if urgency:
            return slots[0]
        if time_hint in ("tomorrow_morning", "morning"):
            morning = [s for s in slots if int(s.split(":")[0]) < 12]
            if morning:
                return "10:00" if "10:00" in morning else morning[0]
        return slots[0]

    def _slot_datetime(self, time_hint: str, slot: str) -> str:
        base = datetime.utcnow()
        if time_hint.startswith("tomorrow") or time_hint == "tomorrow":
            base += timedelta(days=1)
        hour, minute = map(int, slot.split(":"))
        return base.replace(hour=hour, minute=minute, second=0, microsecond=0).isoformat() + "Z"

    def run(self, context: dict[str, Any]) -> dict[str, Any]:
        intent = context["intent"]
        provider: Provider = context["recommended"]
        session_id = context["session_id"]
        customer_name = context.get("customer_name", "Demo Customer")
        slot = self._pick_slot(provider, intent.parsed_datetime_hint, intent.urgency)
        slot_datetime = self._slot_datetime(intent.parsed_datetime_hint, slot)

        amount_pkr = estimate_cost_pkr(intent.service_type)
        confirmation = (
            f"Booking reserved with {provider.name} for {intent.service_label} "
            f"at {intent.location} on {intent.time_expression}. Slot: {slot}. "
            f"Complete payment of PKR {amount_pkr} to confirm. SMS/WhatsApp sent after payment."
        )

        placeholder_receipt = build_receipt(
            booking_id="PENDING",
            customer_name=customer_name,
            provider_name=provider.name,
            service_label=intent.service_label,
            location=intent.location,
            time_expression=intent.time_expression,
            slot=slot,
            slot_datetime=slot_datetime,
            phone=provider.phone,
        )

        raw = database.save_booking(
            session_id=session_id,
            user_id=context.get("user_id"),
            customer_name=customer_name,
            provider_id=provider.id,
            provider_name=provider.name,
            service_type=intent.service_type,
            location=intent.location,
            slot=slot,
            slot_datetime=slot_datetime,
            confirmation_message=confirmation,
            receipt=placeholder_receipt,
            payment_status="pending",
            amount_pkr=amount_pkr,
        )
        raw["receipt"] = build_receipt(
            booking_id=raw["booking_id"],
            customer_name=customer_name,
            provider_name=provider.name,
            service_label=intent.service_label,
            location=intent.location,
            time_expression=intent.time_expression,
            slot=slot,
            slot_datetime=slot_datetime,
            phone=provider.phone,
        )

        booking = BookingResult(**raw)
        context["booking"] = booking
        context["last_trace"] = self.trace(
            "simulate_booking",
            {"provider_id": provider.id, "slot": slot, "state": "PENDING→CONFIRMED"},
            {**booking.model_dump(), "artifact": "booking_receipt"},
            (
                f"Booking {booking.booking_id} persisted (PENDING_PAYMENT, PKR {amount_pkr}). "
                f"Receipt generated; awaiting payment confirmation."
            ),
        )
        return context
