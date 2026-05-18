"""Generate providers.json with 30 mock providers."""
import json
import random
from pathlib import Path

random.seed(42)
areas = ["G-9", "G-13", "F-7", "F-10", "I-8"]
coords = {
    "G-9": (33.684, 72.988),
    "G-13": (33.687, 72.981),
    "F-7": (33.721, 73.052),
    "F-10": (33.695, 73.018),
    "I-8": (33.668, 73.078),
}
cats = ["electrician", "plumber", "ac_technician", "cleaner", "carpenter", "painter"]
names = [
    "احمد الیکٹریشن",
    "علی پلمبنگ",
    "حسن AC سروسز",
    "فاطمہ کلیننگ",
    "عمر بڑھئی",
    "زین پینٹر",
    "بیلال الیکٹریشن",
    "Usman Plumber",
    "کامران کولنگ",
    "سارہ ہوم کلین",
    "جاوید کارپینٹر",
    "نادیہ پینٹ",
    "طارق وائرنگ",
    "راشد پائپ فٹنگ",
    "شہباز AC",
    "مریم صفائی",
    "اقبال لکڑی",
    "سمیع رنگ",
    "فرحان الیکٹریشن",
    "عمران پلمبنگ",
    "واقس HVAC",
    "عائشہ کلینر",
    "ناصر فرنیچر",
    "حنا ڈیکور",
    "عثمان الیکٹریشن",
    "بلال پلمبنگ",
    "عادل AC ماسٹر",
    "ریحانہ کلین",
    "سجاد کارپینٹر",
    "ماہین پینٹ ورک",
]
price_min = {
    "electrician": 1800,
    "plumber": 1500,
    "ac_technician": 2200,
    "cleaner": 1200,
    "carpenter": 1700,
    "painter": 1900,
}
providers = []
for i in range(30):
    area = areas[i % 5]
    cat = cats[i % 6]
    lat, lng = coords[area]
    lat += random.uniform(-0.008, 0.008)
    lng += random.uniform(-0.008, 0.008)
    rating = round(random.uniform(3.5, 5.0), 1)
    pmin = price_min[cat]
    pmax = pmin + random.randint(800, 2000)
    providers.append(
        {
            "id": f"h{i + 1}",
            "name": names[i],
            "category": cat,
            "categories": [cat],
            "area": area,
            "lat": round(lat, 4),
            "lng": round(lng, 4),
            "rating": rating,
            "reviews": random.randint(12, 220),
            "verified": rating >= 4.2,
            "price_min_pkr": pmin,
            "price_max_pkr": pmax,
            "bio": f"Trusted {cat} in {area}, Islamabad",
            "available_slots": ["09:00", "11:00", "14:00", "16:00"],
            "phone": f"+92-3{random.randint(10, 99)}-{random.randint(1000000, 9999999)}",
        }
    )
out = Path(__file__).resolve().parent.parent / "app" / "data" / "providers.json"
out.write_text(json.dumps(providers, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {len(providers)} providers to {out}")
