import json
import os
import re
from typing import Any

SERVICE_PATTERNS: list[tuple[str, str, str]] = [
    (r"ac\s*tech|ac\s*technician|a\.?c\.?|air\s*condition", "ac_technician", "AC Technician"),
    (r"clean|cleaner|safai|صفائی", "cleaner", "Cleaner"),
    (r"plumb|pipe|leak|paani|pani", "plumber", "Plumber"),
    (r"electric|bijli|wiring|wire", "electrician", "Electrician"),
    (r"tutor|tuition|padhai|teacher|math|ٹیوٹر|ٹیوٹر", "tutor", "Home Tutor"),
    (r"beauti|salon|makeup|hair", "beautician", "Beautician"),
    (r"carpent|furniture|wood", "carpenter", "Carpenter"),
    (r"paint|painter", "painter", "Painter"),
]

LOCATION_PATTERN = re.compile(
    r"\b([A-Z]-\d{1,2}|G-\d{1,2}|F-\d{1,2}|I-\d{1,2}|"
    r"DHA\s*Phase\s*\d+|Islamabad|Rawalpindi|Bahria|DHA|Blue\s*Area)\b",
    re.IGNORECASE,
)

TIME_PATTERNS: list[tuple[re.Pattern[str], str, str]] = [
    (re.compile(r"kal\s*subah|tomorrow\s*morning|next\s*morning", re.I), "tomorrow_morning", "Tomorrow morning"),
    (re.compile(r"kal\s*shaam|tomorrow\s*evening", re.I), "tomorrow_evening", "Tomorrow evening"),
    (re.compile(r"kal|tomorrow", re.I), "tomorrow", "Tomorrow"),
    (re.compile(r"aaj\s*shaam|today\s*evening", re.I), "today_evening", "Today evening"),
    (re.compile(r"aaj|today|abhi|urgent|jaldi|right\s*now", re.I), "today", "Today"),
    (re.compile(r"subah|morning", re.I), "morning", "Morning"),
    (re.compile(r"shaam|evening", re.I), "evening", "Evening"),
]

URGENCY_PATTERN = re.compile(r"urgent|jaldi|abhi|right\s*now|فوری", re.I)


def _detect_language(text: str) -> str:
    if re.search(r"[\u0600-\u06FF]", text):
        return "urdu"
    roman_markers = ("mujhe", "chahiye", "kal", "subah", "mein", "ka", "ki", "hai", "aaj")
    lower = text.lower()
    if any(m in lower for m in roman_markers):
        return "roman_urdu"
    return "english"


def _extract_service(text: str) -> tuple[str, str]:
    lower = text.lower()
    for pattern, key, label in SERVICE_PATTERNS:
        if re.search(pattern, lower, re.I) or re.search(pattern, text):
            return key, label
    return "general", "General Service"


def _extract_location(text: str) -> str:
    match = LOCATION_PATTERN.search(text)
    if match:
        val = match.group(1)
        if re.search(r"dha", val, re.I):
            return "DHA"
        val_upper = val.upper()
        if len(val_upper) <= 4 and "-" in val_upper:
            return val_upper
        return val.title() if val.lower() == "blue area" else val_upper
    if re.search(r"اٹھویں|ایٹھویں|i-?\s*8\b|آئی.?8", text, re.I):
        return "I-8"
    if "islamabad" in text.lower():
        return "Islamabad"
    return "G-13"


def _extract_time(text: str) -> tuple[str, str]:
    for pattern, key, label in TIME_PATTERNS:
        if pattern.search(text):
            return key, label
    return "flexible", "As soon as available"


def parse_intent(message: str) -> dict[str, Any]:
    language = _detect_language(message)
    service_type, service_label = _extract_service(message)
    location = _extract_location(message)
    time_key, time_label = _extract_time(message)
    return {
        "raw_message": message.strip(),
        "language": language,
        "service_type": service_type,
        "service_label": service_label,
        "location": location,
        "time_expression": time_label,
        "parsed_datetime_hint": time_key,
        "urgency": bool(URGENCY_PATTERN.search(message)),
    }


def parse_intent_with_gemini(message: str) -> dict[str, Any] | None:
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        prompt = (
            "Extract service booking intent from user message (Urdu/Roman Urdu/English). "
            "Return JSON only with keys: language, service_type (snake_case), "
            "service_label, location, time_expression, parsed_datetime_hint, urgency (boolean)."
            f"\nMessage: {message}"
        )
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        text = (response.text or "").strip()
        if "```" in text:
            text = re.sub(r"```json?\s*", "", text)
            text = text.replace("```", "").strip()
        data = json.loads(text)
        data["raw_message"] = message.strip()
        return data
    except Exception:
        return None


def understand_intent(message: str, use_llm: bool = True) -> dict[str, Any]:
    if use_llm:
        llm_result = parse_intent_with_gemini(message)
        if llm_result:
            return llm_result
    return parse_intent(message)
