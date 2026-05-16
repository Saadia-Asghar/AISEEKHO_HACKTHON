from abc import ABC, abstractmethod
from typing import Any

from app.models.schemas import AgentPhase, TraceEntry


class BaseAgent(ABC):
    name: str
    phase: AgentPhase

    @abstractmethod
    def run(self, context: dict[str, Any]) -> dict[str, Any]:
        pass

    def trace(self, action: str, inp: dict, out: dict, reasoning: str) -> TraceEntry:
        return TraceEntry(
            agent=self.name,
            phase=self.phase,
            action=action,
            input=inp,
            output=out,
            reasoning=reasoning,
        )
