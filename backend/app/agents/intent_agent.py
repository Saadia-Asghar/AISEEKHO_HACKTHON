import os
from typing import Any

from app.agents.base import BaseAgent
from app.models.schemas import AgentPhase, ServiceIntent
from app.services.gemini_intent import understand_intent


class IntentUnderstandingAgent(BaseAgent):
    name = "IntentUnderstandingAgent"
    phase = AgentPhase.PLANNING

    def run(self, context: dict[str, Any]) -> dict[str, Any]:
        message = context["message"]
        parsed, intent_mode = understand_intent(message)
        intent = ServiceIntent(**parsed)
        context["intent"] = intent
        context["intent_mode"] = intent_mode
        context["last_trace"] = self.trace(
            "parse_natural_language",
            {"message": message, "mode": intent_mode},
            intent.model_dump(),
            (
                f"Intent parsed via {intent_mode}. Language '{intent.language}', "
                f"service '{intent.service_label}', location '{intent.location}', "
                f"time '{intent.time_expression}'."
            ),
        )
        return context
