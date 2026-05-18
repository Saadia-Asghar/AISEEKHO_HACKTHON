"""Gemini-backed intent extraction with rule-based fallback."""

import json
import os
import re
from typing import Any

from app.services.nlu import parse_intent


def _map_gemini_payload(data: dict[str, Any], message: str) -> dict[str, Any]:
    from app.services.nlu import _detect_language, _extract_service

    service_type = data.get("service_type") or "general"
    if service_type == "general":
        service_type, service_label = _extract_service(message)
    else:
        _, service_label = _extract_service(message)
        if service_type in ("ac", "ac_technician"):
            service_label = "AC Technician"
        else:
            service_label = service_type.replace("_", " ").title()

    datetime_str = str(data.get("datetime_str") or data.get("time_expression") or "flexible")
    time_map = {
        "tomorrow morning": ("tomorrow_morning", "Tomorrow morning"),
        "tomorrow": ("tomorrow", "Tomorrow"),
        "today": ("today", "Today"),
        "urgent": ("today", "Today"),
        "now": ("today", "Today"),
    }
    hint, label = time_map.get(datetime_str.lower(), (datetime_str.replace(" ", "_"), datetime_str))
    if hint == datetime_str.replace(" ", "_") and "tomorrow" in datetime_str.lower():
        hint, label = "tomorrow", "Tomorrow"

    return {
        "raw_message": message.strip(),
        "language": data.get("language") or _detect_language(message),
        "service_type": service_type,
        "service_label": data.get("service_label") or service_label,
        "location": data.get("location") or "G-13",
        "time_expression": label,
        "parsed_datetime_hint": hint,
        "urgency": bool(data.get("urgency", False)),
    }


def extract_intent_with_gemini(message: str) -> tuple[dict[str, Any] | None, str]:
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None, "rule_based"

    prompt = (
        f"Extract from: '{message}'. Return ONLY JSON: "
        "{{service_type, location, datetime_str, urgency}}"
    )

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        for model in ("gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"):
            try:
                response = client.models.generate_content(model=model, contents=prompt)
                text = (response.text or "").strip()
                if "```" in text:
                    text = re.sub(r"```json?\s*", "", text)
                    text = text.replace("```", "").strip()
                data = json.loads(text)
                return _map_gemini_payload(data, message), "gemini"
            except Exception:
                continue
    except Exception:
        return None, "rule_based"
    return None, "rule_based"


def understand_intent(message: str) -> tuple[dict[str, Any], str]:
    llm, mode = extract_intent_with_gemini(message)
    if llm:
        return llm, mode
    return parse_intent(message), "rule_based"
