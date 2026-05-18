from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.google_speech import transcribe_audio_base64

router = APIRouter(prefix="/api", tags=["google"])


class TranscribeBody(BaseModel):
    audio_base64: str = Field(..., description="Base64-encoded audio")
    mime_type: str = "audio/webm"


@router.post("/speech/transcribe")
def transcribe_speech(body: TranscribeBody):
    try:
        text, mode = transcribe_audio_base64(body.audio_base64, body.mime_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    if mode == "unavailable" or not text:
        raise HTTPException(
            status_code=503,
            detail="Google speech unavailable. Set GOOGLE_API_KEY and try again.",
        )
    return {"text": text, "mode": mode, "provider": "google_gemini"}


@router.get("/google/status")
def google_status():
    import os

    return {
        "gemini_configured": bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")),
        "maps_configured": bool(os.getenv("GOOGLE_MAPS_API_KEY")),
    }
