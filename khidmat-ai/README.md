# KhidmatAI monorepo

- **`mobile/`** — Expo Router app (single frontend; tabs + stack)
- **`web/`** — Next.js ops dashboard
- **`backend/`** — legacy copy; use repo root **`backend/`** for the live API

## Mobile quick start

```powershell
cd mobile
npm install
$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"
npx expo start
```

Screens: Home · Bookings · Trace · Profile · Auth · Results · Booking confirm · Provider detail.
