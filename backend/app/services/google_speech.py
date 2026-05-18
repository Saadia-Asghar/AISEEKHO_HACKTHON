"""Speech-to-text via Gemini (Google GenAI)."""

import base64
import os
from typing import Any


def transcribe_audio_base64(audio_b64: str, mime_type: str = "audio/webm") -> tuple[str, str]:
    """
    Transcribe audio using Gemini. Returns (text, mode).
    mode: gemini | unavailable
    """
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "", "unavailable"

    try:
        raw = base64.b64decode(audio_b64, validate=True)
    except Exception as e:
        raise ValueError("Invalid audio data") from e

    if len(raw) < 100:
        raise ValueError("Audio too short")

    prompt = (
        "Transcribe this voice note for a Pakistan home-services app. "
        "The user may speak Urdu, Roman Urdu, or English. "
        "Return ONLY the transcription text, no quotes or explanation."
    )

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        for model in ("gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=[
                        {
                            "parts": [
                                {"inline_data": {"mime_type": mime_type, "data": raw}},
                                {"text": prompt},
                            ]
                        }
                    ],
                )
                text = (response.text or "").strip()
                if text:
                    return text, "gemini"
            except Exception:
                try:
                    from google.genai import types

                    response = client.models.generate_content(
                        model=model,
                        contents=[
                            types.Content(
                                role="user",
                                parts=[
                                    types.Part.from_bytes(data=raw, mime_type=mime_type),
                                    types.Part.from_text(text=prompt),
                                ],
                            )
                        ],
                    )
                    text = (response.text or "").strip()
                    if text:
                        return text, "gemini"
                except Exception:
                    continue
    except Exception:
        return "", "unavailable"

    return "", "unavailable"
