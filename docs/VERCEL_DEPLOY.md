# Vercel deploy checklist (KhidmatAI web)

Code is already on `main`. Vercel builds from **repo root** using `vercel.json`.

## 1. GitHub

Latest `main` must include: `vercel.json`, root `package.json`, `khidmat-ai/mobile/` (with `package-lock.json`).

## 2. Vercel project settings

| Setting | Value |
|---------|--------|
| **Root Directory** | *(empty — repository root)* |
| **Framework** | Other |
| **Build Command** | *(from `vercel.json`)* `npm run build:web --prefix khidmat-ai/mobile` |
| **Output Directory** | `khidmat-ai/mobile/dist` |

## 3. Environment variables

Set in Vercel → **Settings** → **Environment Variables** → **Production** (and Preview if needed):

| Name | Example | Required |
|------|---------|----------|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Optional — real SMS OTP; omit for demo `1234` |
| `KHIDMAT_USE_RENDER` | `1` | Optional — only if you deploy FastAPI on Render and want bookings/DB there |
| `KHIDMAT_API_UPSTREAM` | `https://…onrender.com` | Only when `KHIDMAT_USE_RENDER=1` |

**AI/search works without Render** — `api/_lib/orchestrateDiscover.js` runs on Vercel with the same mock provider dataset.

Then **Deployments** → **Redeploy**.

Test: `https://aiseekho-hackthon.vercel.app/health` → JSON `"mode": "vercel-edge"`, `"agents": 6`.

## 4. Verify build log

You should see:

- `expo export -p web`
- `Exported: dist`

## 5. Verify live site

- https://aiseekho-hackthon.vercel.app → **sign-in** (phone + Skip guest)
- https://aiseekho-hackthon.vercel.app/auth → same
- Not `404 NOT_FOUND`, not stuck on “AI agents are finding your perfect match…”

## 6. Backend (Render) — optional

Use Render only for persistent bookings, Clerk sync, Stripe, etc. Set `KHIDMAT_USE_RENDER=1` and `KHIDMAT_API_UPSTREAM`. Demo AI search does **not** need Render.
