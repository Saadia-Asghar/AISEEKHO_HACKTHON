"""Provider profiles with enriched metadata."""

import json
from pathlib import Path
from typing import Any

from app.db import user_data

PROVIDERS_PATH = Path(__file__).resolve().parent.parent / "data" / "providers.json"

CATEGORY_LABELS = {
    "ac_technician": "AC Technician",
    "plumber": "Plumber",
    "electrician": "Electrician",
    "cleaner": "Cleaner",
    "carpenter": "Carpenter",
    "painter": "Painter",
    "tutor": "Home Tutor",
    "beautician": "Beautician",
}

PRICE_RANGES: dict[str, tuple[int, int]] = {
    "ac_technician": (2200, 4500),
    "plumber": (1500, 3500),
    "electrician": (1800, 4000),
    "cleaner": (1200, 2800),
    "carpenter": (1700, 3800),
    "painter": (1900, 4200),
    "tutor": (1200, 3000),
    "beautician": (2000, 5000),
}


def _load_all() -> list[dict[str, Any]]:
    with open(PROVIDERS_PATH, encoding="utf-8") as f:
        return json.load(f)


def enrich_provider(raw: dict[str, Any]) -> dict[str, Any]:
    cat = raw.get("category", "general")
    pmin, pmax = PRICE_RANGES.get(cat, (1500, 3500))
    agg = user_data.get_provider_aggregate_rating(raw["id"])
    reviews_total = agg["static_reviews"] + agg["user_rating_count"]
    return {
        **raw,
        "service_label": CATEGORY_LABELS.get(cat, cat.replace("_", " ").title()),
        "bio": raw.get(
            "bio",
            f"Trusted {CATEGORY_LABELS.get(cat, 'service')} in {raw.get('area', 'Islamabad')} "
            f"with {reviews_total}+ jobs completed.",
        ),
        "photo_url": raw.get("photo_url"),
        "verified": raw.get("verified", raw.get("rating", 0) >= 4.5),
        "price_min_pkr": raw.get("price_min_pkr", pmin),
        "price_max_pkr": raw.get("price_max_pkr", pmax),
        "visit_fee_pkr": raw.get("visit_fee_pkr", min(500, pmin // 3)),
        "hourly_rate_pkr": raw.get("hourly_rate_pkr", pmin),
        "jobs_completed": raw.get("jobs_completed", reviews_total * 3 + 12),
        "response_time_min": raw.get("response_time_min", 25),
        "rating": agg["effective_rating"],
        "review_count": reviews_total,
    }


def get_provider(provider_id: str) -> dict[str, Any] | None:
    for p in _load_all():
        if p["id"] == provider_id:
            return enrich_provider(p)
    return None


def list_nearby(service_type: str | None, lat: float | None, lng: float | None, limit: int = 5) -> list[dict[str, Any]]:
    from app.services.geo import haversine_km, resolve_user_coords

    ulat, ulng = (lat, lng) if lat and lng else resolve_user_coords("G-13")
    out: list[dict[str, Any]] = []
    for p in _load_all():
        if service_type and service_type not in p.get("categories", [p["category"]]):
            continue
        dist = haversine_km(ulat, ulng, p["lat"], p["lng"])
        if dist > 15:
            continue
        e = enrich_provider(p)
        e["distance_km"] = dist
        out.append(e)
    out.sort(key=lambda x: x["distance_km"])
    return out[:limit]
