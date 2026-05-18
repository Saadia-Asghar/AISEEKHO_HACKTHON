# KhidmatAI — AI Service Orchestrator for Informal Economy

**Google Antigravity Hackathon 2026 — Challenge 2**

*Speak your need. KhidmatAI handles the rest.*

> PRD notes: see [docs/KHIDMAT_NOTES.md](docs/KHIDMAT_NOTES.md)

Agentic system that understands natural-language service requests (Urdu, Roman Urdu, English), discovers and ranks local providers, simulates booking end-to-end, and automates follow-up — with a **mandatory mobile app** and full **agent trace** visibility.

## Architecture

```
User (Mobile App)
    → POST /api/orchestrate
        → IntentUnderstandingAgent      [planning]
        → ProviderDiscoveryAgent        [planning]
        → RankingAgent                  [decision]
        → BookingAgent                    [action]
        → FollowUpAgent                   [follow-up]
    ← Structured result + trace[]
```

| Component | Role |
|-----------|------|
| **Google Antigravity** | Agent-first IDE for building/orchestrating this repo; use `skills/informal-economy-orchestrator/SKILL.md` |
| **Google ADK** (optional) | `agents/service_orchestrator/` — LLM wrapper calling the same pipeline |
| **FastAPI backend** | Multi-agent orchestration, SQLite bookings, trace persistence |
| **Expo mobile** | Primary UI — request input, results, agent trace tab |

## Quick start

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

API: http://127.0.0.1:8000 — docs at `/docs`

### 2. Mobile (Expo)

```powershell
cd mobile
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` in `.env` to your PC LAN IP when testing on a physical device (e.g. `http://192.168.1.5:8000`).

### 3. Optional: Gemini intent parsing

Copy `.env.example` → `.env` and set `GOOGLE_API_KEY`. Without it, rule-based NLU still handles the demo phrase.

### 4. Optional: ADK web UI

```powershell
pip install google-adk httpx
cd agents
adk web --port 8080
```

## Demo scenario (from project guide)

**Input:** `Mujhe kal subah G-13 mein AC technician chahiye`

**Output:**

- Service: AC Technician · Location: G-13 · Time: Tomorrow morning  
- Provider: Ali AC Services (~2.1 km)  
- Booking: slot 10:00 AM, confirmation saved  
- Follow-up: reminder 1 hour before appointment  
- Full reasoning in **Agent trace** tab  

## APIs & tools

| Tool | Usage |
|------|--------|
| Mock provider dataset | `backend/app/data/providers.json` |
| Google Maps / Places | Hook in `ProviderDiscoveryAgent` (replace mock loader) |
| Gemini | Optional NLU via `GOOGLE_API_KEY` |
| SQLite | Bookings, follow-ups, agent traces |

## User features (ratings & saved workers)

- **Profile** — local user id (`POST /api/users`)  
- **Rate workers** after booking (`POST /api/users/ratings`) — updates community effective rating  
- **Save favorites** — boosts future recommendations (+5% personalization score)  
- **History & rebook** — see past bookings; book again from Saved tab  

See [docs/USER_FLOW.md](docs/USER_FLOW.md) for market research and full flow diagram.

## Deliverables checklist

- [x] Working mobile prototype (Expo)  
- [x] Agent trace / logs (API + mobile tab)  
- [x] README (architecture, Antigravity, APIs, assumptions)  
- [x] User ratings + saved workers + personalized ranking  
- [ ] Demo video (3–5 min) — record locally  

## Assumptions & limitations

- Mock providers for Islamabad sectors (G-13, F-7, I-8); no real WhatsApp/SMS.  
- Booking and notifications are **simulated** with DB persistence and confirmation text.  
- Antigravity is the recommended platform for agent development; this repo is Antigravity/ADK-ready.  
- No real personal data — sample phone numbers only.  

## Project structure

```
backend/          FastAPI + 5 agents + SQLite
mobile/           Expo React Native app
agents/           Google ADK root agent (optional)
skills/           Antigravity skill definition
```

Built for **AISEEKHO Hackathon** — Challenge 2: AI Service Orchestrator for Informal Economy.
