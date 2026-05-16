from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class AgentPhase(str, Enum):
    PLANNING = "planning"
    DECISION = "decision"
    ACTION = "action"
    FOLLOW_UP = "follow_up"


class TraceEntry(BaseModel):
    agent: str
    phase: AgentPhase
    action: str
    input: dict[str, Any] = Field(default_factory=dict)
    output: dict[str, Any] = Field(default_factory=dict)
    reasoning: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


class ServiceIntent(BaseModel):
    raw_message: str
    language: str
    service_type: str
    service_label: str
    location: str
    time_expression: str
    parsed_datetime_hint: str
    urgency: bool = False


class Provider(BaseModel):
    id: str
    name: str
    category: str
    area: str
    distance_km: float
    rating: float
    reviews: int
    available_slots: list[str]
    phone: str
    available_now: bool = True
    score: float | None = None
    rank_reason: str | None = None
    score_breakdown: dict[str, float] | None = None


class BookingResult(BaseModel):
    booking_id: str
    customer_name: str
    provider_id: str
    provider_name: str
    service_type: str
    location: str
    slot: str
    slot_datetime: str
    status: str
    confirmation_message: str
    receipt: str


class FollowUpResult(BaseModel):
    reminder_scheduled: bool
    reminder_time: str
    completion_check_time: str
    status_update: str
    booking_status: str


class TraceSummary(BaseModel):
    steps: int
    outcome: str
    agents: list[str]
    human_readable: str


class OrchestrationResponse(BaseModel):
    session_id: str
    intent: ServiceIntent
    candidates: list[Provider]
    top_three: list[Provider]
    recommended: Provider
    booking: BookingResult
    follow_up: FollowUpResult
    trace: list[TraceEntry]
    trace_summary: TraceSummary


class ServiceRequest(BaseModel):
    message: str
    session_id: str | None = None
    customer_name: str = "Demo Customer"
