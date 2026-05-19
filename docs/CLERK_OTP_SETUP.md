# Clerk phone OTP (real SMS) + demo fallback

KhidmatAI uses **Clerk** for real SMS OTP when keys are set. Without keys, the app uses **demo OTP `1234`** via the backend.

## Flow

| Keys set? | Send OTP | Verify |
|-----------|----------|--------|
| **Yes** — `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | Clerk sends SMS (6-digit code) | Clerk → `/api/auth/sync` → app session |
| **No** | Backend demo (`1234`) | `/api/auth/verify` |
| **Guest** | Always demo | `+923000000000` / `1234` or **Skip** |

## 1. Clerk Dashboard

1. [dashboard.clerk.com](https://dashboard.clerk.com) → create application.
2. **User & authentication** → **Phone**:
   - Enable **Sign-up with phone**
   - Enable **Sign-in with phone**
   - Enable **Verify at sign-up** (recommended)
   - Disable **Password** if you only want OTP
3. Copy **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`).

## 2. Environment variables

> **Expo / Vercel use `EXPO_PUBLIC_*`, not `NEXT_PUBLIC_*`.**  
> Clerk’s Next.js quickstart does not apply to this repo — we already use `@clerk/clerk-expo` + a custom sign-in screen.

**Local** (already in gitignored files if you set them up):

| File | Variable |
|------|----------|
| `khidmat-ai/mobile/.env` | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| `backend/.env` | `CLERK_SECRET_KEY` |

**Vercel** (mobile web):

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
EXPO_PUBLIC_API_URL=https://your-api.onrender.com
```

**Render** (API):

```env
CLERK_SECRET_KEY=sk_test_xxxxxxxx
```

Redeploy both after saving. Never commit real keys to GitHub.

## 3. Test

1. Open the app → sign-in screen.
2. Enter a real Pakistani number (`03XX XXXXXXX`).
3. Tap **Send OTP** — you should get a **6-digit SMS** (not the demo banner).
4. Enter the code → home.

**Demo / judges:** **Skip — Continue as Guest** or `3000000000` + `1234`.

## 4. Troubleshooting

| Issue | Fix |
|-------|-----|
| Still shows “Demo code: 1234” | Publishable key missing on Vercel or invalid placeholder |
| “Phone OTP not enabled” | Enable phone sign-in/sign-up in Clerk Dashboard |
| SMS not received (trial) | Clerk may rate-limit; check Clerk → SMS logs |
| Sync 401 | Set `CLERK_SECRET_KEY` on Render and redeploy API |
| `/health` `clerk_configured: false` | Add secret on Render |

## 5. Optional: Twilio via backend

If you prefer Twilio instead of Clerk, set `TWILIO_*` on Render only (no Clerk keys). The app will use backend OTP (Twilio or demo).
