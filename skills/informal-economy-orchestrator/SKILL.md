---
name: khidmatai-orchestrator
description: KhidmatAI — orchestrate informal-economy service requests from natural language through booking and follow-up.
---

# Informal Economy Service Orchestrator

Use this skill when building or extending the AI Service Orchestrator hackathon project.

## Workflow (mandatory agentic pipeline)

1. **IntentUnderstandingAgent** — Parse Urdu / Roman Urdu / English; extract service, location, time.
2. **ProviderDiscoveryAgent** — Find providers (mock dataset or Google Maps Places API).
3. **RankingAgent** — Rank by distance, rating, availability; explain selection.
4. **BookingAgent** — Simulate booking, persist confirmation, assign provider.
5. **FollowUpAgent** — Schedule reminders and status updates.

## Commands

```bash
# Backend API
cd backend && python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python run.py

# Mobile (Expo)
cd mobile && npm install && npx expo start

# Optional ADK web UI
pip install google-adk httpx
adk web --port 8080
```

## Demo phrase

`Mujhe kal subah G-13 mein AC technician chahiye`

Expected: Ali AC Services ~2.1km, slot 10:00 AM, confirmation + reminder trace.
