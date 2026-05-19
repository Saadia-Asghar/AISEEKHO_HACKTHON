"""Transparent pricing: estimates, typical jobs, and copy for repairs."""

from typing import Any

from app.services.payments import SERVICE_BASE_PKR
from app.services.providers import CATEGORY_LABELS, PRICE_RANGES

VISIT_FEE_NOTE_EN = "Visit / diagnosis fee may apply. Parts are extra."
VISIT_FEE_NOTE_UR = "وزٹ / چیک اپ فیس الگ ہو سکتی ہے۔ پارٹس کی قیمت علاوہ ہے۔"
FINAL_PRICE_NOTE_EN = "Final price confirmed after visit for repair jobs."
FINAL_PRICE_NOTE_UR = "مرمت کے کام کی حتمی قیمت وزٹ کے بعد طے ہوگی۔"

TYPICAL_JOBS: dict[str, list[dict[str, Any]]] = {
    "ac_technician": [
        {"title": "AC gas refill", "title_ur": "AC گیس ریفل", "min": 3500, "max": 5500},
        {"title": "General service", "title_ur": "جنرل سروس", "min": 2200, "max": 4000},
        {"title": "Installation", "title_ur": "انسٹالیشن", "min": 4500, "max": 8000},
    ],
    "plumber": [
        {"title": "Tap / leak fix", "title_ur": "ٹنکی / لیکج", "min": 1500, "max": 3500},
        {"title": "Pipe blockage", "title_ur": "پائپ بلاک", "min": 2000, "max": 4500},
        {"title": "Geyser connection", "title_ur": "گیزر کنکشن", "min": 2500, "max": 5000},
    ],
    "electrician": [
        {"title": "Switch / socket", "title_ur": "سوئچ / ساکٹ", "min": 1200, "max": 2800},
        {"title": "Wiring fault", "title_ur": "وائرنگ فالٹ", "min": 2000, "max": 5000},
        {"title": "DB / breaker", "title_ur": "بریکر", "min": 2500, "max": 6000},
    ],
    "cleaner": [
        {"title": "Regular home clean", "title_ur": "گھر کی صفائی", "min": 1200, "max": 2500},
        {"title": "Deep clean", "title_ur": "ڈیپ کلین", "min": 2500, "max": 4500},
    ],
    "painter": [
        {"title": "Single room", "title_ur": "ایک کمرہ", "min": 3500, "max": 7000},
        {"title": "Touch-up", "title_ur": "ٹچ اپ", "min": 1500, "max": 3000},
    ],
    "tutor": [
        {"title": "1 hour session", "title_ur": "1 گھنٹہ کلاس", "min": 1200, "max": 2500},
        {"title": "Monthly package", "title_ur": "ماہانہ پیکج", "min": 8000, "max": 15000},
    ],
    "general": [
        {"title": "Standard visit", "title_ur": "عام وزٹ", "min": 1500, "max": 3000},
    ],
}


def get_typical_jobs(service_type: str) -> list[dict[str, Any]]:
    return TYPICAL_JOBS.get(service_type, TYPICAL_JOBS["general"])


def build_pricing_transparency(service_type: str, lang: str = "en") -> dict[str, Any]:
    pmin, pmax = PRICE_RANGES.get(service_type, (1500, 3500))
    base = SERVICE_BASE_PKR.get(service_type, SERVICE_BASE_PKR["general"])
    jobs = get_typical_jobs(service_type)
    ur = lang == "ur"
    typical = [
        {
            "title": j["title"],
            "title_ur": j.get("title_ur"),
            "price_min_pkr": j["min"],
            "price_max_pkr": j["max"],
        }
        for j in jobs
    ]
    return {
        "estimate_min_pkr": min(pmin, base),
        "estimate_max_pkr": max(pmax, base + 500),
        "visit_fee_note": VISIT_FEE_NOTE_UR if ur else VISIT_FEE_NOTE_EN,
        "final_price_note": FINAL_PRICE_NOTE_UR if ur else FINAL_PRICE_NOTE_EN,
        "service_label": CATEGORY_LABELS.get(service_type, service_type.replace("_", " ").title()),
        "typical_jobs": typical,
    }
