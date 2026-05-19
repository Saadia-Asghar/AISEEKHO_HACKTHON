from typing import Any

from app.agents.base import BaseAgent
from app.db import user_data
from app.models.schemas import AgentPhase, PersonalizationSummary, Provider


class RankingAgent(BaseAgent):
    name = "RankingAgent"
    phase = AgentPhase.DECISION

    def _personalization_component(
        self, provider_id: str, ctx: dict[str, Any]
    ) -> tuple[float, list[str]]:
        """0–10 boost from saved workers, past bookings, and user's own ratings."""
        notes: list[str] = []
        score = 0.0
        saved_ids = ctx.get("saved_ids", set())
        user_ratings = ctx.get("user_ratings", {})
        past_ids = ctx.get("past_provider_ids", set())

        if provider_id in saved_ids:
            score += 4.0
            notes.append("saved worker (+4)")
        if provider_id in past_ids:
            score += 1.5
            notes.append("booked before (+1.5)")
        stars = user_ratings.get(provider_id)
        if stars is not None:
            if stars >= 5:
                score += 3.0
                notes.append(f"you rated {stars}★ (+3)")
            elif stars >= 4:
                score += 2.0
                notes.append(f"you rated {stars}★ (+2)")
            elif stars <= 2:
                score -= 4.0
                notes.append(f"you rated {stars}★ (−4)")

        return max(0.0, min(10.0, score)), notes

    def _score(
        self,
        provider: Provider,
        time_hint: str,
        urgency: bool,
        personalization_ctx: dict[str, Any],
    ) -> tuple[float, str, dict[str, float], PersonalizationSummary | None]:
        # 40% distance, 35% rating, 25% availability (+ small personalization bonus)
        distance_component = max(0.0, 10.0 - 2.0 * min(provider.distance_km, 5.0))

        agg = user_data.get_provider_aggregate_rating(provider.id)
        effective_rating = agg["effective_rating"]
        rating_component = (effective_rating / 5.0) * 10.0

        availability_component = 10.0 if provider.available_now and provider.available_slots else 0.0
        if urgency and provider.available_slots:
            availability_component = 10.0
        if time_hint in ("tomorrow_morning", "morning") and provider.available_slots:
            if any(int(s.split(":")[0]) < 12 for s in provider.available_slots):
                availability_component = max(availability_component, 10.0)

        pers_component, pers_notes = self._personalization_component(provider.id, personalization_ctx)

        breakdown = {
            "distance_40pct": round(distance_component * 0.4, 2),
            "rating_35pct": round(rating_component * 0.35, 2),
            "availability_25pct": round(availability_component * 0.25, 2),
        }
        total = round(sum(breakdown.values()) + round(pers_component * 0.05, 2), 2)

        pers_summary = None
        if pers_notes:
            pers_summary = PersonalizationSummary(
                saved_boost_applied=provider.id in personalization_ctx.get("saved_ids", set()),
                repeat_provider_boost=provider.id in personalization_ctx.get("past_provider_ids", set()),
                user_rating_influence="; ".join(pers_notes),
            )

        reason = (
            f"Total {total}/10 — distance {provider.distance_km}km → {breakdown['distance_40pct']} (40%), "
            f"rating {effective_rating}★ → {breakdown['rating_35pct']} (35%), "
            f"availability → {breakdown['availability_25pct']} (25%)"
        )
        if pers_notes:
            reason += f" [personalization: {'; '.join(pers_notes)}]"

        return total, reason, breakdown, pers_summary

    def _apply_filters(self, candidates: list[Provider], context: dict[str, Any]) -> list[Provider]:
        out = list(candidates)
        max_km = context.get("max_distance_km")
        if max_km is not None:
            out = [p for p in out if p.distance_km <= float(max_km)]
        min_rating = context.get("min_rating")
        if min_rating is not None:
            out = [p for p in out if (p.effective_rating or p.rating) >= float(min_rating)]
        if context.get("verified_only"):
            out = [p for p in out if p.verified]
        if context.get("available_today"):
            out = [p for p in out if p.available_now and p.available_slots]
        return out if out else candidates

    def run(self, context: dict[str, Any]) -> dict[str, Any]:
        intent = context["intent"]
        candidates: list[Provider] = self._apply_filters(context.get("candidates", []), context)
        context["candidates"] = candidates
        user_id = context.get("user_id")
        personalization_ctx = user_data.get_personalization_context(user_id)

        if not candidates:
            raise ValueError("No providers found for this request.")

        ranked: list[Provider] = []
        applied_personalization: PersonalizationSummary | None = None

        for p in candidates:
            agg = user_data.get_provider_aggregate_rating(p.id)
            is_saved = p.id in personalization_ctx["saved_ids"]
            your_rating = personalization_ctx["user_ratings"].get(p.id)

            score, reason, breakdown, pers = self._score(
                p, intent.parsed_datetime_hint, intent.urgency, personalization_ctx
            )
            if pers and not applied_personalization:
                applied_personalization = pers

            ranked.append(
                p.model_copy(
                    update={
                        "score": score,
                        "rank_reason": reason,
                        "score_breakdown": breakdown,
                        "rating": agg["effective_rating"],
                        "effective_rating": agg["effective_rating"],
                        "reviews": agg["static_reviews"] + agg["user_rating_count"],
                        "is_saved": is_saved,
                        "your_rating": your_rating,
                    }
                )
            )

        ranked.sort(key=lambda x: x.score or 0, reverse=True)

        price_sort = context.get("price_sort", "smart")
        if price_sort == "low":
            ranked.sort(
                key=lambda x: (x.price_min_pkr if x.price_min_pkr is not None else 999999, x.distance_km)
            )
        elif price_sort == "high":
            ranked.sort(
                key=lambda x: (-(x.price_max_pkr or x.price_min_pkr or 0), x.distance_km)
            )

        past_ids = personalization_ctx["past_provider_ids"]
        ranked = [
            p.model_copy(update={"contacted_before": p.id in past_ids})
            for p in ranked
        ]

        recommended = ranked[0]
        top_three = ranked[:3]

        top_rated = sorted(
            ranked,
            key=lambda x: (x.effective_rating or x.rating, -(x.reviews or 0)),
            reverse=True,
        )
        top_rated = [p for p in top_rated if (p.effective_rating or p.rating) >= 4.0][:3]
        context["top_rated"] = top_rated

        if recommended.is_saved or recommended.your_rating:
            applied_personalization = PersonalizationSummary(
                saved_boost_applied=recommended.is_saved,
                repeat_provider_boost=recommended.id in personalization_ctx["past_provider_ids"],
                user_rating_influence=f"Top pick influenced by your history ({recommended.name})",
            )

        context["candidates"] = ranked
        context["top_three"] = top_three
        context["recommended"] = recommended
        context["personalization"] = applied_personalization
        context["last_trace"] = self.trace(
            "rank_and_select",
            {
                "candidate_count": len(candidates),
                "user_id": user_id,
                "saved_count": len(personalization_ctx["saved_ids"]),
            },
            {
                "recommended_id": recommended.id,
                "recommended_name": recommended.name,
                "effective_rating": recommended.effective_rating,
                "top_3": [
                    {
                        "name": r.name,
                        "score": r.score,
                        "is_saved": r.is_saved,
                        "breakdown": r.score_breakdown,
                    }
                    for r in top_three
                ],
            },
            (
                f"Selected '{recommended.name}' at {recommended.distance_km} km, score {recommended.score}. "
                f"{recommended.rank_reason}"
            ),
        )
        return context
