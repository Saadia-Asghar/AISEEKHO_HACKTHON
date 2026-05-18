# KhidmatAI

**Bolein, Hum Karein** — AI service orchestrator for Pakistan home services.

## Stack

| Layer | Path | Tech |
|-------|------|------|
| Mobile | `khidmat-ai/mobile` | Expo Router, React Native, AsyncStorage auth |
| Backend | `backend` | FastAPI, SQLite, 5-agent pipeline |
| Web | `khidmat-ai/web` | Next.js dashboard (optional) |

## Run

```powershell
# Backend
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py

# Mobile (device: use your LAN IP)
cd khidmat-ai\mobile
npm install
$env:EXPO_PUBLIC_API_URL="http://YOUR_LAN_IP:8000"
npx expo start
```

## Auth

Phone `+92` + 10 digits → OTP **1234** (mock). Session stored in AsyncStorage; `user_id` is sent on every API call.

## API highlights

- `POST /api/auth/verify` · `POST /api/orchestrate`
- `GET /api/bookings/user/{user_id}` · `PATCH /api/bookings/{id}/cancel`
- `GET /api/suggestions?hour=0-23` · `GET /api/providers/{id}` · `POST /api/reviews`

### Google (hackathon)

Copy `backend/.env.example` → `backend/.env` and set:

- `GOOGLE_API_KEY` — Gemini intent + voice transcription (`POST /api/speech/transcribe`)
- `GOOGLE_MAPS_API_KEY` — Geocoding for discovery (falls back to local sector coords)

Check: `GET http://127.0.0.1:8000/api/google/status` and `GET /health`.

**Connected flow:** Mobile auth → SQLite users · Home mic → Gemini STT → orchestrate · Trace loads from DB · Reviews saved to `provider_ratings`.
