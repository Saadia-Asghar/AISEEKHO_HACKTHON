"""SMS (Twilio), WhatsApp (Meta Cloud API), and FCM-style simulated push with deep links."""

import logging
import os
from typing import Any
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)


def whatsapp_deep_link(phone: str, message: str) -> str:
    """wa.me deep link — opens WhatsApp with pre-filled text (PRD mock guidance)."""
    digits = phone.replace(" ", "").lstrip("+").replace("-", "")
    if digits.startswith("0"):
        digits = "92" + digits[1:]
    elif not digits.startswith("92") and len(digits) <= 11:
        digits = "92" + digits
    return f"https://wa.me/{digits}?text={quote(message)}"


def _simulated(
    channel: str,
    to: str,
    body: str,
    *,
    deep_link: str | None = None,
    scheduled_at: str | None = None,
) -> dict[str, Any]:
    logger.info("[NOTIFY:%s] to=%s body=%s", channel, to, body[:80])
    out: dict[str, Any] = {
        "channel": channel,
        "to": to,
        "status": "simulated",
        "provider": "mock",
        "preview": body[:200],
    }
    if deep_link:
        out["deep_link"] = deep_link
    if scheduled_at:
        out["scheduled_at"] = scheduled_at
    return out


def send_fcm_simulated(
    device_label: str,
    title: str,
    body: str,
    *,
    scheduled_at: str | None = None,
) -> dict[str, Any]:
    """Simulated Firebase Cloud Messaging push (PRD allows mock notifications)."""
    return _simulated(
        "fcm",
        device_label,
        f"{title}: {body}",
        scheduled_at=scheduled_at,
    )


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
        f"HazirAI: Booking {booking_id} confirmed with {provider_name} "
        f"at {location}, slot {slot}. Reply HELP for support."
    )
    provider_msg = (
        f"HazirAI: New job {booking_id} — {location}, {slot}. "
        f"Customer booking via HazirAI orchestrator."
    )
    results: list[dict[str, Any]] = []

    if customer_phone:
        if "sms" in channels:
            results.append(send_sms(customer_phone, customer_msg))
        if "whatsapp" in channels:
            wa = send_whatsapp(customer_phone, customer_msg)
            wa["deep_link"] = whatsapp_deep_link(customer_phone, customer_msg)
            results.append(wa)
    else:
        results.append(_simulated("sms", "customer-missing", customer_msg))

    if "sms" in channels:
        results.append(send_sms(provider_phone, provider_msg))
    if "whatsapp" in channels:
        wa = send_whatsapp(provider_phone, provider_msg)
        wa["deep_link"] = whatsapp_deep_link(provider_phone, provider_msg)
        results.append(wa)

    return results


def schedule_follow_up_notifications(
    booking_id: str,
    provider_name: str,
    slot: str,
    reminder_time: str,
    completion_time: str,
    customer_phone: str | None = None,
    provider_phone: str | None = None,
) -> list[dict[str, Any]]:
    """FCM-simulated reminder + completion prompts (logged to Antigravity trace)."""
    reminder_body = (
        f"Reminder: {provider_name} arrives in 1 hour (slot {slot}). Booking {booking_id}."
    )
    completion_body = (
        f"Was your service with {provider_name} completed? Tap to rate on KhidmatAI. {booking_id}"
    )
    scheduled: list[dict[str, Any]] = [
        send_fcm_simulated("customer_device", "KhidmatAI Reminder", reminder_body, scheduled_at=reminder_time),
        send_fcm_simulated(
            "customer_device",
            "Service completed?",
            completion_body,
            scheduled_at=completion_time,
        ),
    ]
    if customer_phone:
        scheduled.append(
            _simulated(
                "whatsapp",
                customer_phone,
                reminder_body,
                deep_link=whatsapp_deep_link(customer_phone, reminder_body),
                scheduled_at=reminder_time,
            )
        )
    if provider_phone:
        job_msg = f"Job reminder: {booking_id} at {slot} with customer via KhidmatAI."
        scheduled.append(
            _simulated(
                "whatsapp",
                provider_phone,
                job_msg,
                deep_link=whatsapp_deep_link(provider_phone, job_msg),
                scheduled_at=reminder_time,
            )
        )
    return scheduled
