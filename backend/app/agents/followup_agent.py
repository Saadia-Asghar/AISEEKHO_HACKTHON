from typing import Any

from app.agents.base import BaseAgent
from app.db import database
from app.models.schemas import AgentPhase, FollowUpResult
from app.services.notifications import schedule_follow_up_notifications


class FollowUpAgent(BaseAgent):
    name = "FollowUpAgent"
    phase = AgentPhase.FOLLOW_UP

    def run(self, context: dict[str, Any]) -> dict[str, Any]:
        booking = context["booking"]
        reminder_time = database.reminder_time_for_slot(booking.slot)
        completion_time = database.completion_check_for_slot(booking.slot)
        message = (
            f"Reminder scheduled 1 hour before appointment ({booking.slot}) at {reminder_time}. "
            f"Completion check at {completion_time}. "
            f"SMS/WhatsApp to customer and {booking.provider_name} fire after payment is confirmed."
        )
        raw = database.save_follow_up(
            booking_id=booking.booking_id,
            reminder_time=reminder_time,
            completion_check_time=completion_time,
            message=message,
        )
        follow_up = FollowUpResult(**raw)
        provider_phone = context.get("provider_phone", "+92-300-0000000")
        scheduled = schedule_follow_up_notifications(
            booking.booking_id,
            booking.provider_name,
            booking.slot,
            reminder_time,
            completion_time,
            customer_phone=context.get("customer_phone"),
            provider_phone=provider_phone,
        )
        context["follow_up"] = follow_up
        context["scheduled_notifications"] = scheduled
        context["last_trace"] = self.trace(
            "schedule_follow_up",
            {
                "booking_id": booking.booking_id,
                "state": "CONFIRMED→REMINDER_SCHEDULED",
                "channels": ["fcm_simulated", "whatsapp_deep_link"],
            },
            {**follow_up.model_dump(), "scheduled_notifications": scheduled},
            (
                "FCM reminder + completion check scheduled; WhatsApp deep links generated. "
                "Logged to Antigravity Node 5 (FollowUpAgent)."
            ),
        )
        return context
