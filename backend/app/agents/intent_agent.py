from typing import Any

from app.agents.base import BaseAgent
from app.models.schemas import AgentPhase, ServiceIntent
from app.services.nlu import understand_intent


class IntentUnderstandingAgent(BaseAgent):
    name = "IntentUnderstandingAgent"
    phase = AgentPhase.PLANNING

    def run(self, context: dict[str, Any]) -> dict[str, Any]:
        message = context["message"]
        parsed = understand_intent(message)
        intent = ServiceIntent(**parsed)
        context["intent"] = intent
        context["last_trace"] = self.trace(
            "parse_natural_language",
            {"message": message},
            intent.model_dump(),
            (
                f"Detected language '{intent.language}'. Extracted service '{intent.service_label}', "
                f"location '{intent.location}', time '{intent.time_expression}'."
            ),
        )
        return context
