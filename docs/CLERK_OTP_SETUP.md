# Clerk phone OTP — KhidmatAI (Expo)

Clerk’s dashboard may show the **Expo** quickstart (`@clerk/expo`). This repo uses the same stack with package **`@clerk/clerk-expo`** (equivalent for our SDK version) and a **custom phone UI** at `/auth` — you do **not** need to delete tabs or add `(auth)/sign-in.tsx` from their template.

## Clerk Dashboard checklist

1. **User & authentication → Phone**
   - Sign-in with phone: **ON**
   - Sign-up with phone: **ON**
   - Verify at sign-up: **ON** (recommended)
   - Password: **OFF**

2. **Native applications** (Configure → Native applications)  
   Enable the **Native API** for Expo / mobile builds.

3. **API Keys** — copy publishable + secret keys.

4. **“Watching for users”**  
   Completes after the **first successful sign-up** in your app (real phone OTP or guest demo does not count for Clerk — only a Clerk-verified phone sign-in/sign-up).

## Environment variables

| Where | Variable | Value |
|-------|----------|--------|
| `khidmat-ai/mobile/.env` | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` |
| `backend/.env` | `CLERK_SECRET_KEY` | `sk_test_...` |
| **Vercel** | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | same publishable key |
| **Vercel** | `EXPO_PUBLIC_API_URL` | Render API URL |
| **Render** | `CLERK_SECRET_KEY` | same secret key |

Use **`EXPO_PUBLIC_*`**, not `NEXT_PUBLIC_*`.

## Already wired in this repo

| Clerk guide step | KhidmatAI |
|------------------|-----------|
| Install `@clerk/expo` + `expo-secure-store` | `@clerk/clerk-expo` + `expo-secure-store` in `package.json` |
| `ClerkProvider` + `tokenCache` | `components/ClerkProviderGate.tsx` |
| Custom phone sign-in | `app/auth.tsx` + `lib/clerkPhoneOtp.ts` |
| Session → backend | `POST /api/auth/sync` → KhidmatAI token |
| No Clerk keys | Demo OTP **1234** fallback |
| Logout | Clears Clerk + local session → `/auth` |
| Bot protection | `<View nativeID="clerk-captcha" />` on auth screen |

## Run locally

```powershell
# API
cd d:\project\backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# App (restart after .env changes)
cd d:\project\khidmat-ai\mobile
npx expo start --web --clear
```

1. Open app → **sign-in** screen.  
2. Enter `03XXXXXXXXX` → **Send OTP** → 6-digit SMS.  
3. **Verify** → home.  
4. Clerk dashboard should show your first user.

**Judges (no SMS):** **Skip — Continue as Guest** or `3000000000` / `1234`.

## Verify deployment

```http
GET https://YOUR-API.onrender.com/health
```

Expect: `"clerk_configured": true`

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Still demo `1234` | Publishable key missing on Vercel; redeploy |
| “Phone OTP not enabled” | Clerk → Phone toggles (sign-in + sign-up) |
| SMS not received | Check Clerk → Logs; verify phone on trial |
| Sync 401 | `CLERK_SECRET_KEY` on Render |
| “Clerk user not ready” | Tap Verify again; ensure captcha / network OK |
| Dashboard still “Watching for users” | Complete one **Clerk** phone sign-up (not guest skip) |

## Do not follow from Clerk guide

- Removing `app/(tabs)` or replacing the whole app structure  
- Next.js `middleware.ts` or `NEXT_PUBLIC_*`  
- Email/password examples (this app uses **phone OTP** only)
