import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

class FollowUpAgent:
    def __init__(self, db):
        self.db = db

    async def schedule(self, booking: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        
        appt_time_str = booking.get("appointment_time")
        if not appt_time_str:
            appt_time = datetime.now(timezone.utc) + timedelta(hours=2)
        else:
            appt_time = datetime.fromisoformat(appt_time_str)
            
        # 1. Calculate reminder time (1 hour before)
        reminder_time = appt_time - timedelta(hours=1)
        completion_check_time = appt_time + timedelta(minutes=30)
        
        # 2. Write follow_up documents
        # TODO: Integrate real Google Cloud Tasks here for delayed execution
        try:
            b_id = booking.get("booking_id")
            s_type = booking.get("service_type")
            u_id = booking.get("user_id")
            p_id = booking.get("provider_id")
            
            f1 = {
                "booking_id": b_id,
                "user_id": u_id,
                "provider_id": p_id,
                "reminder_time": reminder_time.isoformat(),
                "type": "pre_appointment",
                "status": "scheduled",
                "message": f"Your {s_type} appointment is in 1 hour!"
            }
            
            f2 = {
                "booking_id": b_id,
                "user_id": u_id,
                "provider_id": p_id,
                "reminder_time": completion_check_time.isoformat(),
                "type": "completion_check",
                "status": "scheduled",
                "message": "Was your service completed? Rate your experience."
            }
            
            self.db.collection("follow_ups").add(f1)
            self.db.collection("follow_ups").add(f2)
        except Exception as e:
            print(f"Firestore follow-up scheduling error: {e}")
            
        duration_ms = int((time.time() - start_time) * 1000)
        
        log_entry = {
            "step_number": 6,
            "agent_name": "FollowUpAgent",
            "action": "schedule_reminder",
            "input": f"appointment: {appt_time_str}",
            "output": f"Reminder set for {reminder_time.strftime('%I:%M %p')} (T-60min)",
            "duration_ms": duration_ms
        }
        
        return {
            "follow_ups_scheduled": 2,
            "reminder_time": reminder_time.isoformat(),
            "log": log_entry
        }
