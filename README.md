# HazirAI

**Bolein, Hum Karein** — You speak, we do.

AI service orchestrator for Pakistan’s home services: voice/text booking, provider matching, and agent trace visibility.

## Brand

- Primary: `#6C3FE8` (purple) · Accent: `#F97316` (orange)
- Dark UI: bg `#09090B`, cards `#27272A`
- Logo: purple circle + **H** (`mobile/src/components/HazirLogo.tsx`)

## Stack

| Layer | Tech |
|-------|------|
| Mobile | Expo 52, React Native, Inter, `@gorhom/bottom-sheet`, axios |
| Backend | FastAPI, SQLite, 5-agent pipeline |
| Auth | Phone + mock OTP `1234` |

## Run

```powershell
# Backend
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py

# Mobile (set LAN IP for device testing)
cd mobile
npm install
$env:EXPO_PUBLIC_API_URL="http://YOUR_LAN_IP:8000"
npx expo start
```

## API highlights

- `POST /auth/otp/send` · `POST /auth/otp/verify`
- `POST /api/orchestrate` — intent → discovery → ranking → booking → follow-up
- `GET /api/bookings` · `PATCH /api/bookings/{id}/cancel`
- `GET /api/suggestions?hour=N` — 4 time-aware service chips
- `GET /api/providers/{id}/reviews` · `POST /api/reviews`

30 mock providers (electrician, plumber, AC, cleaner, carpenter, painter) across **G-9, G-13, F-7, F-10, I-8**.

## Mobile flow

Splash (2s) → Onboarding (3 slides) → Phone auth → **Home** · **Bookings** · **Profile**

Demo login: any phone + OTP **1234**.
