from typing import Any

from app.agents.base import BaseAgent
from app.db import database
from app.models.schemas import AgentPhase, FollowUpResult


class FollowUpAgent(BaseAgent):
    name = "FollowUpAgent"
    phase = AgentPhase.FOLLOW_UP

    def run(self, context: dict[str, Any]) -> dict[str, Any]:
        booking = context["booking"]
        reminder_time = database.reminder_time_for_slot(booking.slot)
        completion_time = database.completion_check_for_slot(booking.slot)
        message = (
            f"Reminder scheduled 1 hour before appointment ({booking.slot}) at {reminder_time}. "
            f"Completion check prompt at {completion_time}. "
            f"Provider {booking.provider_name} notified (FCM/WhatsApp simulated)."
        )
        raw = database.save_follow_up(
            booking_id=booking.booking_id,
            reminder_time=reminder_time,
            completion_check_time=completion_time,
            message=message,
        )
        follow_up = FollowUpResult(**raw)
        context["follow_up"] = follow_up
        context["last_trace"] = self.trace(
            "schedule_follow_up",
            {"booking_id": booking.booking_id, "state": "CONFIRMED→REMINDER_SCHEDULED"},
            follow_up.model_dump(),
            "Post-booking automation: reminder + service-completed prompt logged to Antigravity trace.",
        )
        return context
