# KhidmatAI

**Bolein, Hum Karein** — AI service orchestrator for Pakistan home services.

## Design (Framer)

| | |
|--|--|
| **Published prototype** | https://splendid-gibbon-403400.framer.app |
| **Mobile theme** | `#7C3AED`, `#09090B` in `khidmat-ai/mobile/constants/theme.ts` |

## Stack

| Layer | Path | Tech |
|-------|------|------|
| Mobile | `khidmat-ai/mobile` | Expo Router, React Native |
| Backend | `backend` | FastAPI, SQLite, 5-agent pipeline |

## Quick start

```powershell
.\scripts\preview.ps1
```

- App: http://localhost:8081  
- API: http://127.0.0.1:8000  
- Guest: `+923000000000` / OTP **1234**, or **Skip** on auth  

On a **physical phone**, set `EXPO_PUBLIC_API_URL` to your PC LAN IP (see `khidmat-ai/mobile/.env.example`).

## Booking flow (current)

1. **Discover** — `POST /api/discover` (preview, no charge)
2. **Create booking** — `POST /api/bookings/create` (after provider pick)
3. **Pay** — `POST /api/payments/confirm` (SMS/WhatsApp to customer + provider)
4. **Review** — confirmation screen + `POST /api/reviews`

Legacy alias: `POST /api/orchestrate` = discover only (same as `/api/discover`).

## Auth

- **Demo:** OTP `1234` for any 4-digit attempt when Twilio is not configured.
- **Production:** set `TWILIO_*` in `backend/.env` for real SMS OTP.

## API highlights

- `POST /api/discover` · `POST /api/bookings/create`
- `POST /api/payments/confirm`
- `GET /api/bookings/user/{user_id}`
- `POST /api/provider/jobs/{id}/respond` — provider accept/decline (demo)
- `GET /api/google/status`

## Google keys

Copy `backend/.env.example` → `backend/.env`:

- `GOOGLE_API_KEY` — Gemini intent + voice
- `GOOGLE_MAPS_API_KEY` — geocoding

## Deploy

See [docs/DEPLOY.md](docs/DEPLOY.md) and `khidmat-ai/mobile/eas.json` for EAS builds.

## Tests

```powershell
cd backend; python -m pytest tests/ -q
cd khidmat-ai\mobile; npx tsc --noEmit
```
