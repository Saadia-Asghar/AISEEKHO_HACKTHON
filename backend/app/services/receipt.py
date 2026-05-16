from datetime import datetime


def build_receipt(
    booking_id: str,
    customer_name: str,
    provider_name: str,
    service_label: str,
    location: str,
    time_expression: str,
    slot: str,
    slot_datetime: str,
    phone: str,
) -> str:
    issued = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    return f"""
══════════════════════════════════════
         KHIDMATAI BOOKING RECEIPT
══════════════════════════════════════
Booking ID:    {booking_id}
Issued:        {issued}
Customer:      {customer_name}
──────────────────────────────────────
Service:       {service_label}
Location:      {location}
When:          {time_expression}
Slot:          {slot} ({slot_datetime})
──────────────────────────────────────
Provider:      {provider_name}
Contact:       {phone}
Status:        CONFIRMED
──────────────────────────────────────
Simulated SMS/WhatsApp confirmation sent.
Reminder scheduled 1 hour before slot.
══════════════════════════════════════
""".strip()
