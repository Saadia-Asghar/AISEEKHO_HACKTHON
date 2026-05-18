from fastapi import APIRouter, Query

router = APIRouter(tags=["suggestions"])

# hour → service_type keys
_MORNING = [
    {"service_type": "electrician", "label": "Electrician", "label_ur": "الیکٹریشن"},
    {"service_type": "plumber", "label": "Plumber", "label_ur": "پلمبر"},
    {"service_type": "ac_technician", "label": "AC Repair", "label_ur": "AC ٹیکنیشن"},
    {"service_type": "cleaner", "label": "Cleaner", "label_ur": "صفائی"},
]
_AFTERNOON = [
    {"service_type": "plumber", "label": "Plumber", "label_ur": "پلمبر"},
    {"service_type": "carpenter", "label": "Carpenter", "label_ur": "بڑھئی"},
    {"service_type": "painter", "label": "Painter", "label_ur": "پینٹر"},
    {"service_type": "electrician", "label": "Electrician", "label_ur": "الیکٹریشن"},
]
_EVENING = [
    {"service_type": "cleaner", "label": "Cleaner", "label_ur": "صفائی"},
    {"service_type": "ac_technician", "label": "AC Repair", "label_ur": "AC ٹیکنیشن"},
    {"service_type": "electrician", "label": "Electrician", "label_ur": "الیکٹریشن"},
    {"service_type": "plumber", "label": "Plumber", "label_ur": "پلمبر"},
]
_NIGHT = [
    {"service_type": "electrician", "label": "Electrician", "label_ur": "الیکٹریشن"},
    {"service_type": "plumber", "label": "Plumber", "label_ur": "پلمبر"},
    {"service_type": "ac_technician", "label": "AC Repair", "label_ur": "AC ٹیکنیشن"},
    {"service_type": "carpenter", "label": "Carpenter", "label_ur": "بڑھئی"},
]

HOURLY: dict[int, list[dict[str, str]]] = {
    **{h: _MORNING for h in range(6, 12)},
    **{h: _AFTERNOON for h in range(12, 17)},
    **{h: _EVENING for h in range(17, 22)},
    **{h: _NIGHT for h in list(range(22, 24)) + list(range(0, 6))},
}


@router.get("/api/suggestions")
def get_suggestions(hour: int = Query(..., ge=0, le=23)):
    items = HOURLY.get(hour, HOURLY[10])
    return {
        "hour": hour,
        "tagline": "Bolein, Hum Karein",
        "suggestions": items[:4],
    }
