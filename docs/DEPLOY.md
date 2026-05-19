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

## Web app (Vercel) — fixes 404 on `*.vercel.app`

Vercel was likely building the **repo root**, which has no `index.html`. Use the config in the repo root `vercel.json` (builds `khidmat-ai/mobile` → `dist/`).

1. **Push to `main`** (required): root `package.json` (`vercel-build`), `vercel.json`, `khidmat-ai/mobile/package.json` (`build:web`). If these are only on your laptop, Vercel keeps serving **404** with no app files.
2. **Vercel → Project → Settings → General**
   - **Root Directory:** **empty** (repo root). Do **not** point at `khidmat-ai/mobile` or `khidmat-ai/web`.
   - Root `vercel.json` must include `buildCommand` (runs `expo export -p web` → `khidmat-ai/mobile/dist`).
3. **Environment variables** (Production + Preview):
   - `EXPO_PUBLIC_API_URL` = `https://your-backend.example.com` (not `127.0.0.1`)
4. **Redeploy** (Deployments → … → Redeploy).
5. Open `https://aiseekho-hackthon.vercel.app` — you should see KhidmatAI login, not `404: NOT_FOUND`.

Local check before push:

```powershell
cd d:\project\khidmat-ai\mobile
npm run build:web
npx serve dist
```

Deploy the **FastAPI backend** separately (Railway, Render, Fly.io). The web app calls `EXPO_PUBLIC_API_URL`; without a public API, login/search will fail even if the UI loads.

---

## Mobile (Expo native / EAS)

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
