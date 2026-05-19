from uuid import uuid4

from app.antigravity.workflow import enrich_trace
from app.agents.booking_agent import BookingAgent
from app.agents.discovery_agent import ProviderDiscoveryAgent
from app.agents.followup_agent import FollowUpAgent
from app.agents.intent_agent import IntentUnderstandingAgent
from app.agents.ranking_agent import RankingAgent
from app.agents.trace_agent import TraceAgent
from app.db import database
from app.db import payments_db
from app.models.schemas import (
    AlternativeRanking,
    DiscoverResponse,
    LocationInfo,
    MapMarker,
    NotificationResult,
    OrchestrationResponse,
    PaymentInfo,
    PersonalizationSummary,
    PricingTransparency,
    Provider,
    ProviderScoreSummary,
    RankingResult,
    ServiceIntent,
    TraceEntry,
    TraceSummary,
    TypicalJobRow,
)
from app.db import auth_db
from app.services.payments import create_payment
from app.services.pricing import build_pricing_transparency


class KhidmatOrchestrator:
    """
    HazirAI pipeline:
    Intent → Discovery → Ranking → (optional) Booking → Follow-Up → Trace
  """

    def __init__(self) -> None:
        self.search_pipeline = [
            IntentUnderstandingAgent(),
            ProviderDiscoveryAgent(),
            RankingAgent(),
        ]
        self.book_pipeline = [
            BookingAgent(),
            FollowUpAgent(),
        ]
        self.trace_agent = TraceAgent()

    def _base_context(
        self,
        message: str,
        session_id: str | None,
        customer_name: str | None,
        user_id: str | None,
        user_lat: float | None,
        user_lng: float | None,
        customer_phone: str | None,
        price_sort: str,
        **filters,
    ) -> tuple[str, dict]:
        database.init_db()
        sid = session_id or str(uuid4())
        resolved_name = customer_name or "Guest"
        if user_id and not customer_name:
            try:
                profile = auth_db.get_user_profile(user_id)
                resolved_name = profile.get("name") or resolved_name
            except ValueError:
                pass
        context: dict = {
            "message": message,
            "session_id": sid,
            "customer_name": resolved_name,
            "user_id": user_id,
            "user_lat": user_lat,
            "user_lng": user_lng,
            "customer_phone": customer_phone,
            "price_sort": price_sort if price_sort in ("smart", "low", "high") else "smart",
            **filters,
        }
        return sid, context

    def _run_agents(self, context: dict, agents: list) -> tuple[dict, list[TraceEntry]]:
        traces: list[TraceEntry] = []
        for agent in agents:
            context = agent.run(context)
            traces.append(enrich_trace(context.pop("last_trace")))
        return context, traces

    def discover(
        self,
        message: str,
        session_id: str | None = None,
        customer_name: str | None = None,
        user_id: str | None = None,
        user_lat: float | None = None,
        user_lng: float | None = None,
        customer_phone: str | None = None,
        price_sort: str = "smart",
        max_distance_km: float | None = None,
        min_rating: float | None = None,
        verified_only: bool = False,
        available_today: bool = False,
        lang: str = "en",
    ) -> DiscoverResponse:
        sid, context = self._base_context(
            message,
            session_id,
            customer_name,
            user_id,
            user_lat,
            user_lng,
            customer_phone,
            price_sort,
            max_distance_km=max_distance_km,
            min_rating=min_rating,
            verified_only=verified_only,
            available_today=available_today,
            lang=lang,
        )
        context, traces = self._run_agents(context, self.search_pipeline)
        context["all_traces"] = traces
        context = self.trace_agent.run(context)
        traces.append(enrich_trace(context.pop("last_trace")))

        summary: TraceSummary = context["trace_summary"]
        database.save_trace(sid, [t.model_dump() for t in traces], summary.model_dump())

        top_three = context.get("top_three", context["candidates"][:3])
        recommended: Provider = context["recommended"]
        ranking = self._build_ranking(recommended, top_three)
        alternatives = self._build_alternatives(top_three)
        personalization: PersonalizationSummary | None = context.get("personalization")
        loc = context.get("user_location")
        user_location = LocationInfo(**loc) if loc else None
        top_rated: list[Provider] = context.get("top_rated", [])
        map_markers = self._build_map_markers(context["candidates"], recommended.id)

        intent: ServiceIntent = context["intent"]
        pricing_raw = build_pricing_transparency(intent.service_type, lang=lang if lang in ("en", "ur") else "en")
        pricing = PricingTransparency(
            **{
                **pricing_raw,
                "typical_jobs": [TypicalJobRow(**j) for j in pricing_raw["typical_jobs"]],
            }
        )

        database.save_discover_session(
            sid,
            {
                "intent": intent.model_dump(),
                "candidates": [c.model_dump() for c in context["candidates"]],
                "recommended_id": recommended.id,
                "customer_name": context.get("customer_name"),
                "user_id": user_id,
                "customer_phone": customer_phone,
                "price_sort": context.get("price_sort", "smart"),
                "user_location": loc,
                "search_traces": [t.model_dump() for t in traces],
            },
        )

        return DiscoverResponse(
            session_id=sid,
            intent=intent,
            candidates=context["candidates"],
            top_three=top_three,
            top_rated=top_rated,
            recommended=recommended,
            map_markers=map_markers,
            ranking=ranking,
            alternatives=alternatives,
            trace=traces,
            trace_summary=summary,
            personalization=personalization,
            user_location=user_location,
            price_sort=context.get("price_sort", "smart"),
            pricing=pricing,
            preview=True,
        )

    def complete_booking(
        self,
        session_id: str,
        provider_id: str,
        user_id: str,
        customer_name: str | None = None,
        customer_phone: str | None = None,
    ) -> OrchestrationResponse:
        payload = database.get_discover_session(session_id)
        if not payload:
            raise ValueError("Search session expired — please search again.")

        intent = ServiceIntent(**payload["intent"])
        candidates = [Provider(**c) for c in payload["candidates"]]
        provider = next((p for p in candidates if p.id == provider_id), None)
        if not provider:
            raise ValueError("Provider not found in this search.")

        context_provider_phone = provider.phone
        prior_traces = [TraceEntry(**t) for t in payload.get("search_traces", [])]
        loc = payload.get("user_location")

        context: dict = {
            "intent": intent,
            "candidates": candidates,
            "recommended": provider,
            "top_three": candidates[:3],
            "session_id": session_id,
            "customer_name": customer_name or payload.get("customer_name") or "Guest",
            "user_id": user_id,
            "customer_phone": customer_phone or payload.get("customer_phone"),
            "provider_phone": context_provider_phone,
            "price_sort": payload.get("price_sort", "smart"),
            "user_location": loc,
        }

        traces: list[TraceEntry] = list(prior_traces)
        context, book_traces = self._run_agents(context, self.book_pipeline)
        traces.extend(book_traces)

        context["all_traces"] = traces
        context = self.trace_agent.run(context)
        traces.append(enrich_trace(context.pop("last_trace")))

        summary: TraceSummary = context["trace_summary"]
        database.save_trace(session_id, [t.model_dump() for t in traces], summary.model_dump())

        top_three = context.get("top_three", candidates[:3])
        recommended = context["recommended"]
        ranking = self._build_ranking(recommended, top_three)
        alternatives = self._build_alternatives(top_three)
        personalization = context.get("personalization")

        scheduled_notifs = [
            NotificationResult(**n) for n in context.get("scheduled_notifications", [])
        ]

        booking = context["booking"]
        amount = booking.amount_pkr or 1500
        pay_raw = create_payment(booking.booking_id, amount, method="card", user_id=user_id)
        payments_db.save_payment(
            pay_raw["payment_id"],
            booking.booking_id,
            user_id,
            amount,
            pay_raw.get("method", "card"),
            pay_raw.get("status", "pending"),
            pay_raw.get("stripe_payment_intent_id"),
        )
        payment = PaymentInfo(
            payment_id=pay_raw["payment_id"],
            booking_id=booking.booking_id,
            amount_pkr=amount,
            method=pay_raw.get("method", "card"),
            status=pay_raw.get("status", "pending"),
            simulated=pay_raw.get("simulated", False),
            instructions=pay_raw.get("instructions"),
            stripe_client_secret=pay_raw.get("stripe_client_secret"),
            stripe_payment_intent_id=pay_raw.get("stripe_payment_intent_id"),
        )
        user_location = LocationInfo(**loc) if loc else None
        top_rated = [p for p in candidates if (p.effective_rating or p.rating) >= 4.0][:3]
        map_markers = self._build_map_markers(candidates, recommended.id)
        pricing_raw = build_pricing_transparency(intent.service_type)

        return OrchestrationResponse(
            session_id=session_id,
            intent=intent,
            candidates=candidates,
            top_three=top_three,
            top_rated=top_rated,
            recommended=recommended,
            map_markers=map_markers,
            ranking=ranking,
            alternatives=alternatives,
            booking=booking,
            payment=payment,
            follow_up=context["follow_up"],
            trace=traces,
            trace_summary=summary,
            personalization=personalization,
            rate_booking=False,
            user_location=user_location,
            notifications=scheduled_notifs,
            price_sort=payload.get("price_sort", "smart"),
        )

    def run(
        self,
        message: str,
        session_id: str | None = None,
        customer_name: str | None = None,
        user_id: str | None = None,
        user_lat: float | None = None,
        user_lng: float | None = None,
        customer_phone: str | None = None,
        price_sort: str = "smart",
        **kwargs,
    ) -> OrchestrationResponse:
        """Full flow (search + book) — kept for tests and legacy clients."""
        disc = self.discover(
            message,
            session_id,
            customer_name,
            user_id,
            user_lat,
            user_lng,
            customer_phone,
            price_sort,
            max_distance_km=kwargs.get("max_distance_km"),
            min_rating=kwargs.get("min_rating"),
            verified_only=kwargs.get("verified_only", False),
            available_today=kwargs.get("available_today", False),
            lang=kwargs.get("lang", "en"),
        )
        return self.complete_booking(
            disc.session_id,
            disc.recommended.id,
            user_id or "",
            customer_name,
            customer_phone,
        )

    @staticmethod
    def _build_map_markers(candidates: list[Provider], recommended_id: str) -> list[MapMarker]:
        markers: list[MapMarker] = []
        for p in candidates:
            if p.lat is None or p.lng is None:
                continue
            markers.append(
                MapMarker(
                    id=p.id,
                    name=p.name,
                    lat=p.lat,
                    lng=p.lng,
                    distance_km=p.distance_km,
                    rating=p.effective_rating or p.rating,
                    area=p.area or "",
                    category=p.category or "",
                    price_min_pkr=p.price_min_pkr,
                    price_max_pkr=p.price_max_pkr,
                    is_recommended=p.id == recommended_id,
                    contacted_before=p.contacted_before or False,
                )
            )
        return markers[:12]

    @staticmethod
    def _build_ranking(top: Provider, ranked: list[Provider]) -> RankingResult:
        alts: list[AlternativeRanking] = []
        for p in ranked:
            if p.id == top.id:
                continue
            bd = p.score_breakdown or {}
            alts.append(
                AlternativeRanking(
                    provider=p,
                    score=p.score or 0.0,
                    distance_km=p.distance_km,
                    rating=p.effective_rating or p.rating,
                    availability=bd.get("availability_25pct", 0.0) / 0.25 if bd else 0.0,
                    score_breakdown=bd,
                )
            )
            if len(alts) >= 2:
                break
        return RankingResult(top_provider=top, alternatives=alts)

    @staticmethod
    def _build_alternatives(ranked: list[Provider]) -> list[ProviderScoreSummary]:
        out: list[ProviderScoreSummary] = []
        for p in ranked[1:3]:
            bd = p.score_breakdown or {}
            out.append(
                ProviderScoreSummary(
                    name=p.name,
                    provider_id=p.id,
                    score=p.score or 0.0,
                    distance_score=bd.get("distance_40pct", 0.0),
                    rating_score=bd.get("rating_35pct", 0.0),
                    availability_score=bd.get("availability_25pct", 0.0),
                    total_score=p.score or 0.0,
                )
            )
        return out


ServiceOrchestrator = KhidmatOrchestrator
