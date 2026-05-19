from fastapi import APIRouter

from app.services.pricing import build_pricing_transparency

router = APIRouter(tags=["pricing"])


@router.get("/api/pricing/typical-jobs")
def typical_jobs(category: str = "general", lang: str = "en"):
    return build_pricing_transparency(category, lang=lang if lang in ("en", "ur") else "en")
