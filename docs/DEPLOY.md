# KhidmatAI — Deploy & production checklist

## Backend (FastAPI)

1. Copy `backend/.env.example` → `backend/.env` and set keys (Google, Twilio, Stripe, WhatsApp).
2. Host on any Python aaS (Railway, Render, Fly.io, VPS):
   ```bash
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
3. For production scale, migrate SQLite → PostgreSQL (replace `database.py` connection string) and enable HTTPS behind a reverse proxy.
4. Restrict CORS to your app origin instead of `*`.

## Mobile (Expo)

1. Set `EXPO_PUBLIC_API_URL` in `khidmat-ai/mobile/.env` to your deployed API URL.
2. Install EAS CLI: `npm i -g eas-cli` and run `eas login`.
3. Configure `eas.json` production `env.EXPO_PUBLIC_API_URL`.
4. Build:
   ```bash
   cd khidmat-ai/mobile
   eas build --platform android --profile preview
   eas build --platform ios --profile preview
   ```

## End-to-end booking flow

1. Home → discover (preview)
2. Results → pick provider → **Payment** (`POST /api/payments/confirm`)
3. Confirm screen → review

## Provider WhatsApp-style API (demo)

```http
POST /api/provider/jobs/{booking_id}/respond
{ "provider_id": "PROV-001", "action": "accept" }
```

`decline` cancels the booking.

## Health checks

```bash
curl https://your-api/health
curl https://your-api/api/google/status
cd backend && python -m pytest tests/ -q
cd khidmat-ai/mobile && npx tsc --noEmit
```
