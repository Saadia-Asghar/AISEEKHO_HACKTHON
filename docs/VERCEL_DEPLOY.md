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

## 3. Environment variables (required at build time)

Set in Vercel → **Settings** → **Environment Variables** → apply to **Production**, **Preview**, **Development**:

| Name | Example | Required |
|------|---------|----------|
| `EXPO_PUBLIC_API_URL` | `https://khidmatai-api.onrender.com` | **Yes** — without this, auth shows **Network Error** (app tries `127.0.0.1`) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Optional — real SMS OTP; omit for demo `1234` |

Then **Deployments** → latest → **Redeploy** (must rebuild after changing env vars).

## 4. Verify build log

You should see:

- `expo export -p web`
- `Exported: dist`

## 5. Verify live site

- https://aiseekho-hackthon.vercel.app → **sign-in** (phone + Skip guest)
- https://aiseekho-hackthon.vercel.app/auth → same
- Not `404 NOT_FOUND`, not stuck on “AI agents are finding your perfect match…”

## 6. Backend (Render)

Deploy API via `render.yaml`, set `CLERK_SECRET_KEY` if using Clerk, then use that API URL in `EXPO_PUBLIC_API_URL` on Vercel.
