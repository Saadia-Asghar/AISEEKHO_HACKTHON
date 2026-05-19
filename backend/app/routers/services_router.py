"""Service categories for browse-by-category UI."""

from fastapi import APIRouter

from app.services.providers import CATEGORY_LABELS, PRICE_RANGES, _load_all

router = APIRouter(prefix="/api/services", tags=["services"])

CATEGORY_EMOJI: dict[str, str] = {
    "ac_technician": "❄️",
    "plumber": "🔧",
    "electrician": "⚡",
    "cleaner": "🧹",
    "carpenter": "🪚",
    "painter": "🎨",
    "tutor": "📚",
    "beautician": "💄",
    "pc_repair": "💻",
    "appliance_repair": "📺",
    "car_mechanic": "🚗",
}

# Roman Urdu phrase fragment for discover NLU
CATEGORY_PHRASE_UR: dict[str, str] = {
    "ac_technician": "AC technician",
    "plumber": "plumber",
    "electrician": "electrician",
    "cleaner": "cleaner",
    "carpenter": "carpenter",
    "painter": "painter",
    "tutor": "tutor",
    "beautician": "beautician",
    "pc_repair": "computer repair",
    "appliance_repair": "appliance repair",
    "car_mechanic": "car mechanic",
}


@router.get("/categories")
def list_service_categories():
    """All service types with provider counts and suggested search text."""
    counts: dict[str, int] = {}
    for p in _load_all():
        cat = p.get("category", "general")
        counts[cat] = counts.get(cat, 0) + 1

    categories: list[dict] = []
    for cat_id, label in CATEGORY_LABELS.items():
        n = counts.get(cat_id, 0)
        if n == 0:
            continue
        pmin, pmax = PRICE_RANGES.get(cat_id, (1500, 3500))
        phrase = CATEGORY_PHRASE_UR.get(cat_id, cat_id.replace("_", " "))
        categories.append(
            {
                "id": cat_id,
                "label": label,
                "emoji": CATEGORY_EMOJI.get(cat_id, "🔧"),
                "provider_count": n,
                "price_min_pkr": pmin,
                "price_max_pkr": pmax,
                "search_template_en": f"I need a {phrase} in {{area}}",
                "search_template_ur": f"Mujhe {{area}} mein {phrase} chahiye",
            }
        )

    categories.sort(key=lambda c: (-c["provider_count"], c["label"]))
    return {"categories": categories, "total_providers": sum(counts.values())}
