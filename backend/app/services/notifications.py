"""SMS (Twilio) and WhatsApp (Meta Cloud API) with demo simulation fallback."""

import logging
import os
from typing import Any

import httpx

logger = logging.getLogger(__name__)


def _simulated(channel: str, to: str, body: str) -> dict[str, Any]:
    logger.info("[NOTIFY:%s] to=%s body=%s", channel, to, body[:80])
    return {
        "channel": channel,
        "to": to,
        "status": "simulated",
        "provider": "mock",
        "preview": body[:200],
    }


def send_sms(to_phone: str, body: str) -> dict[str, Any]:
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_num = os.getenv("TWILIO_FROM_NUMBER")
    if not all([sid, token, from_num]):
        return _simulated("sms", to_phone, body)

    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
        with httpx.Client(timeout=15.0) as client:
            r = client.post(
                url,
                auth=(sid, token),
                data={"To": to_phone, "From": from_num, "Body": body},
            )
            r.raise_for_status()
            data = r.json()
            return {
                "channel": "sms",
                "to": to_phone,
                "status": data.get("status", "sent"),
                "provider": "twilio",
                "sid": data.get("sid"),
            }
    except Exception as e:
        logger.warning("Twilio SMS failed: %s", e)
        out = _simulated("sms", to_phone, body)
        out["error"] = str(e)
        return out


def send_whatsapp(to_phone: str, body: str) -> dict[str, Any]:
    wa_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    if not wa_token or not phone_id:
        return _simulated("whatsapp", to_phone, body)

    # E.164 without + for Meta API in some setups; normalize
    to = to_phone.lstrip("+").replace(" ", "")
    try:
        url = f"https://graph.facebook.com/v19.0/{phone_id}/messages"
        with httpx.Client(timeout=15.0) as client:
            r = client.post(
                url,
                headers={"Authorization": f"Bearer {wa_token}"},
                json={
                    "messaging_product": "whatsapp",
                    "to": to,
                    "type": "text",
                    "text": {"body": body},
                },
            )
            r.raise_for_status()
            data = r.json()
            return {
                "channel": "whatsapp",
                "to": to_phone,
                "status": "sent",
                "provider": "meta",
                "message_id": data.get("messages", [{}])[0].get("id"),
            }
    except Exception as e:
        logger.warning("WhatsApp send failed: %s", e)
        out = _simulated("whatsapp", to_phone, body)
        out["error"] = str(e)
        return out


def send_booking_notifications(
    customer_phone: str | None,
    provider_phone: str,
    booking_id: str,
    provider_name: str,
    slot: str,
    location: str,
    channels: list[str] | None = None,
) -> list[dict[str, Any]]:
    channels = channels or ["sms", "whatsapp"]
    customer_msg = (
        f"KhidmatAI: Booking {booking_id} confirmed with {provider_name} "
        f"at {location}, slot {slot}. Reply HELP for support."
    )
    provider_msg = (
        f"KhidmatAI: New job {booking_id} — {location}, {slot}. "
        f"Customer booking via KhidmatAI orchestrator."
    )
    results: list[dict[str, Any]] = []

    if customer_phone:
        if "sms" in channels:
            results.append(send_sms(customer_phone, customer_msg))
        if "whatsapp" in channels:
            results.append(send_whatsapp(customer_phone, customer_msg))
    else:
        results.append(_simulated("sms", "customer-missing", customer_msg))

    if "sms" in channels:
        results.append(send_sms(provider_phone, provider_msg))
    if "whatsapp" in channels:
        results.append(send_whatsapp(provider_phone, provider_msg))

    return results
