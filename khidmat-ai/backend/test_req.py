import time
import requests
import json

data = {
  "user_input": "Mujhe kal subah G-13 mein AC technician chahiye",
  "user_lat": 33.6844,
  "user_lng": 73.0479,
  "user_id": "demo-user-001"
}
try:
    print("Sending request to Orchestrator...")
    res = requests.post("http://localhost:8000/api/v1/request", json=data)
    print("Status:", res.status_code)
    print("Response:", json.dumps(res.json(), indent=2))
except Exception as e:
    print("Error:", e)
