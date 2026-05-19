"""Send login OTP via Twilio SMS (free trial: https://www.twilio.com/try-twilio)."""

import logging
import os
import re
from typing import Any

import httpx

logger = logging.getLogger(__name__)

GUEST_PHONE = "+923000000000"


def twilio_configured() -> bool:
    return bool(
        os.getenv("TWILIO_ACCOUNT_SID")
        and os.getenv("TWILIO_AUTH_TOKEN")
        and os.getenv("TWILIO_FROM_NUMBER")
    )


def normalize_pk_phone(phone: str) -> str:
    """E.164 for Pakistan (+92XXXXXXXXXX)."""
    digits = re.sub(r"\D", "", phone.strip())
    if digits.startswith("92"):
        digits = digits[2:]
    if digits.startswith("0"):
        digits = digits[1:]
    if len(digits) != 10 or not digits.startswith("3"):
        raise ValueError("Enter a valid Pakistani mobile number (03XX XXXXXXX)")
    return f"+92{digits}"


def send_otp_sms(to_phone: str, code: str) -> dict[str, Any]:
    """Deliver OTP SMS. Returns provider twilio on success."""
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_num = os.getenv("TWILIO_FROM_NUMBER")
    if not all([sid, token, from_num]):
        return {"ok": False, "provider": "none", "error": "Twilio not configured"}

    body = f"Your KhidmatAI verification code is {code}. Valid for 10 minutes."
    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
        with httpx.Client(timeout=20.0) as client:
            r = client.post(
                url,
                auth=(sid, token),
                data={"To": to_phone, "From": from_num, "Body": body},
            )
            if r.status_code >= 400:
                logger.warning("Twilio OTP SMS error %s: %s", r.status_code, r.text[:200])
                return {"ok": False, "provider": "twilio", "error": r.text[:120]}
            data = r.json()
            return {
                "ok": True,
                "provider": "twilio",
                "status": data.get("status", "sent"),
                "sid": data.get("sid"),
            }
    except Exception as e:
        logger.warning("Twilio OTP SMS failed: %s", e)
        return {"ok": False, "provider": "twilio", "error": str(e)}
