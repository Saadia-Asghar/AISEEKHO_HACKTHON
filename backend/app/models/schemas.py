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
    lat: float | None = None
    lng: float | None = None
    price_min_pkr: int | None = None
    price_max_pkr: int | None = None
    verified: bool = False
    score: float | None = None
    rank_reason: str | None = None
    score_breakdown: dict[str, float] | None = None
    effective_rating: float | None = None
    is_saved: bool = False
    your_rating: int | None = None
    contacted_before: bool = False


class MapMarker(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    distance_km: float
    rating: float
    price_min_pkr: int | None = None
    price_max_pkr: int | None = None
    is_recommended: bool = False
    contacted_before: bool = False


class ContactedWorker(BaseModel):
    id: str
    name: str
    category: str
    area: str
    rating: float
    phone: str
    last_booked_at: str | None = None
    bookings_count: int = 1
    price_min_pkr: int | None = None
    price_max_pkr: int | None = None


class PersonalizationSummary(BaseModel):
    saved_boost_applied: bool = False
    repeat_provider_boost: bool = False
    user_rating_influence: str | None = None


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
    payment_status: str = "pending"
    amount_pkr: int | None = None
    confirmation_message: str
    receipt: str


class PaymentInfo(BaseModel):
    payment_id: str
    booking_id: str
    amount_pkr: int
    method: str = "card"
    status: str
    simulated: bool = False
    instructions: str | None = None
    stripe_client_secret: str | None = None
    stripe_payment_intent_id: str | None = None


class NotificationResult(BaseModel):
    channel: str
    to: str
    status: str
    provider: str = "mock"
    preview: str | None = None

    model_config = {"extra": "ignore"}


class LocationInfo(BaseModel):
    lat: float
    lng: float
    source: str = "sector_default"


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


class AlternativeRanking(BaseModel):
    provider: Provider
    score: float
    distance_km: float
    rating: float
    availability: float
    score_breakdown: dict[str, float] = Field(default_factory=dict)


class RankingResult(BaseModel):
    top_provider: Provider
    alternatives: list[AlternativeRanking] = Field(default_factory=list)


class ProviderScoreSummary(BaseModel):
    name: str
    provider_id: str
    score: float
    distance_score: float
    rating_score: float
    availability_score: float
    total_score: float


class TypicalJobRow(BaseModel):
    title: str
    title_ur: str | None = None
    price_min_pkr: int
    price_max_pkr: int


class PricingTransparency(BaseModel):
    estimate_min_pkr: int
    estimate_max_pkr: int
    visit_fee_note: str
    final_price_note: str
    service_label: str
    typical_jobs: list[TypicalJobRow] = Field(default_factory=list)


class DiscoverResponse(BaseModel):
    """Preview search — no booking until user confirms."""

    session_id: str
    intent: ServiceIntent
    candidates: list[Provider]
    top_three: list[Provider]
    top_rated: list[Provider] = Field(default_factory=list)
    recommended: Provider
    ranking: RankingResult | None = None
    alternatives: list[ProviderScoreSummary] = Field(default_factory=list)
    map_markers: list[MapMarker] = Field(default_factory=list)
    trace: list[TraceEntry]
    trace_summary: TraceSummary
    personalization: PersonalizationSummary | None = None
    user_location: LocationInfo | None = None
    price_sort: str = "smart"
    pricing: PricingTransparency
    preview: bool = True


class OrchestrationResponse(BaseModel):
    session_id: str
    intent: ServiceIntent
    candidates: list[Provider]
    top_three: list[Provider]
    top_rated: list[Provider] = Field(default_factory=list)
    recommended: Provider
    ranking: RankingResult | None = None
    alternatives: list[ProviderScoreSummary] = Field(default_factory=list)
    map_markers: list[MapMarker] = Field(default_factory=list)
    booking: BookingResult
    payment: PaymentInfo
    follow_up: FollowUpResult
    trace: list[TraceEntry]
    trace_summary: TraceSummary
    personalization: PersonalizationSummary | None = None
    rate_booking: bool = False
    user_location: LocationInfo | None = None
    notifications: list[NotificationResult] = Field(default_factory=list)
    price_sort: str = "smart"


class ServiceRequest(BaseModel):
    message: str
    session_id: str | None = None
    customer_name: str | None = None
    user_id: str | None = None
    user_lat: float | None = None
    user_lng: float | None = None
    customer_phone: str | None = None
    price_sort: str = "smart"  # smart | low | high
    max_distance_km: float | None = None
    min_rating: float | None = None
    verified_only: bool = False
    available_today: bool = False
    lang: str = "en"


class SyncClerkRequest(BaseModel):
    clerk_user_id: str
    display_name: str
    phone: str | None = None


class ConfirmPaymentRequest(BaseModel):
    payment_id: str
    booking_id: str
    method: str = "card"
    user_id: str | None = None
    customer_phone: str | None = None
    stripe_payment_intent_id: str | None = None
    notify_channels: list[str] = Field(default_factory=lambda: ["sms", "whatsapp"])


class CreateUserRequest(BaseModel):
    display_name: str


class SubmitRatingRequest(BaseModel):
    user_id: str
    provider_id: str
    booking_id: str
    stars: int
    comment: str | None = None
