from fastapi import APIRouter, HTTPException, Query

from app.db import user_data
from app.services.providers import get_provider, list_by_category, list_nearby

router = APIRouter(tags=["providers"])

# Static paths MUST be registered before /api/providers/{provider_id}
# or FastAPI treats "list" as a provider id → 404.


@router.get("/api/providers/list")
def providers_by_category(
    category: str = Query(..., min_length=1),
    area: str = Query(""),
    lat: float | None = None,
    lng: float | None = None,
    limit: int = Query(50, ge=1, le=100),
):
    """Workers for browse category — shown before optional AI discover."""
    items = list_by_category(category, area=area, lat=lat, lng=lng, limit=limit)
    return {
        "category": category,
        "area": area.strip() or "all_areas",
        "count": len(items),
        "providers": items,
    }


@router.get("/api/providers/nearby/frequent")
def frequent_nearby(
    user_id: str,
    lat: float | None = None,
    lng: float | None = None,
    limit: int = 4,
):
    bookings = user_data.list_user_bookings(user_id, limit=20)
    seen: set[str] = set()
    frequent_types: list[str] = []
    for b in bookings:
        if b["provider_id"] not in seen:
            seen.add(b["provider_id"])
            frequent_types.append(b["service_type"])
    providers: list[dict] = []
    for st in frequent_types[:2]:
        providers.extend(list_nearby(st, lat, lng, limit=2))
    if len(providers) < limit:
        providers.extend(list_nearby(None, lat, lng, limit=limit - len(providers)))
    return {"providers": providers[:limit]}


@router.get("/api/providers/{provider_id}")
def provider_profile(provider_id: str, user_id: str | None = None):
    p = get_provider(provider_id)
    if not p:
        raise HTTPException(status_code=404, detail="Provider not found")
    reviews = user_data.get_provider_aggregate_rating(provider_id)
    saved = user_data.is_provider_saved(user_id, provider_id) if user_id else False
    return {
        **p,
        "average_rating": reviews["effective_rating"],
        "total_reviews": reviews["user_rating_count"] + reviews["static_reviews"],
        "is_saved": saved,
    }
