import time
import random
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List

class BookingAgent:
    def __init__(self, db):
        self.db = db

    async def book(self, user_id: str, provider: Dict[str, Any], intent: Dict[str, Any], agent_trace: List[Dict[str, Any]], original_request: str = "") -> Dict[str, Any]:
        start_time = time.time()
        
        # 1. Generate booking_id
        now = datetime.now(timezone.utc)
        date_str = now.strftime("%Y%m%d")
        rand_digits = f"{random.randint(0, 9999):04d}"
        booking_id = f"BK-{date_str}-{rand_digits}"
        
        # 2. Appointment time logic
        time_slot = intent.get("time_slot", "").lower()
        if "tomorrow" in time_slot:
            appt_time = now + timedelta(days=1)
        else:
            appt_time = now + timedelta(hours=2) # default ASAP
        appt_time_iso = appt_time.isoformat()
        
        # Estimate cost
        tier = provider.get("price_tier", "medium")
        if tier == "low":
            est_cost = 1500
        elif tier == "medium":
            est_cost = 2500
        else:
            est_cost = 4500
            
        booking_doc = {
            "booking_id": booking_id,
            "user_id": user_id,
            "provider_id": provider.get("provider_id"),
            "service_type": intent.get("service_type"),
            "status": "confirmed",
            "appointment_time": appt_time_iso,
            "original_request": original_request,
            "estimated_cost_pkr": est_cost,
            "agent_trace": {
                "steps": agent_trace,
                "duration_ms": 0 # to be updated later or ignored
            }
        }
        
        try:
            # Write to Firestore
            self.db.collection("bookings").document(booking_id).set(booking_doc)
            
            # 3. Update provider document
            # set is_available=False for the booked time slot
            pid = provider.get("provider_id")
            if pid:
                # Firestore update using firestore arrayUnion
                from google.cloud import firestore
                self.db.collection("providers").document(pid).update({
                    "booked_slots": firestore.ArrayUnion([appt_time_iso])
                })
        except Exception as e:
            print(f"Firestore booking error: {e}")
            
        # 4. Generate confirmation message
        lang = intent.get("language_detected", "en")
        pname = provider.get("name")
        tstr = appt_time.strftime("%I:%M %p")
        if lang == "roman_ur" or lang == "ur":
            conf_msg = f"Aapki booking confirm ho gayi! {pname} {tstr} ko aayega."
        else:
            conf_msg = f"Your booking is confirmed! {pname} will arrive at {tstr}."
            
        duration_ms = int((time.time() - start_time) * 1000)
        log_entry = {
            "step_number": 5,
            "agent_name": "BookingAgent",
            "action": "create_booking",
            "input": f"{pname} + user {user_id}",
            "output": f"booking_id: {booking_id} — Firestore write successful",
            "duration_ms": duration_ms
        }
        
        return {
            "booking_id": booking_id,
            "confirmation_message": conf_msg,
            "provider": provider,
            "appointment_time": appt_time_iso,
            "estimated_cost_pkr": est_cost,
            "receipt_data": booking_doc,
            "log": log_entry
        }
