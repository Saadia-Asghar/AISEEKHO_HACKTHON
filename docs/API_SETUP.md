# KhidmatAI — API & integrations setup (your side)

Step-by-step for keys **you** add in `backend/.env` and `khidmat-ai/mobile/.env`. The app already works without them (demo OTP `1234`, seeded providers, rule-based intent).

---

## 0. Quick local run (before any keys)

```powershell
# Terminal 1 — API
cd d:\project\backend
.\.venv\Scripts\Activate.ps1
python run.py

# Terminal 2 — App
cd d:\project\khidmat-ai\mobile
$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"
npm run web
```

Open **http://localhost:8081** · Guest **+923000000000** / OTP **1234**

Verify:

```powershell
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/google/status
```

---

## 1. Google Gemini (intent + richer agent trace) — **recommended for hackathon**

**What it unlocks:** Urdu/Roman Urdu NLU, better discover copy, Gemini speech-to-text fallback.

1. Go to [Google AI Studio](https://aistudio.google.com/apikey) → Create API key.
2. In `d:\project\backend\.env`:

```env
GOOGLE_API_KEY=your_key_here
# or
GEMINI_API_KEY=your_key_here
```

3. Restart backend.
4. Confirm: `curl http://127.0.0.1:8000/health` → `"gemini_configured": true`
5. In app: Home → **Try Demo** → Trace tab → steps should have richer `reasoning` text.

**Code path:** `backend/app/services/gemini_intent.py`, `backend/app/agents/intent_agent.py`

---

## 2. Google Maps (geocoding + live markers)

**What it unlocks:** Real lat/lng for areas, better map pins on Results, sector labels (G-13, F-7, etc.).

1. [Google Cloud Console](https://console.cloud.google.com/) → enable:
   - Geocoding API  
   - Maps JavaScript API (if you embed a web map later)
2. Create API key → restrict to your APIs.
3. In `backend/.env`:

```env
GOOGLE_MAPS_API_KEY=your_maps_key
```

4. Restart backend; run a discover search; Results → map section shows providers with **area chips** and **Maps** links.

**Code path:** `backend/app/services/google_maps.py`, `backend/app/agents/discovery_agent.py`

**Note:** Mobile uses a lightweight pin map (not full Google Maps SDK). Tapping **Maps** opens Google Maps in the browser.

---

## 3. Voice (speech → text)

| Platform | Behavior |
|----------|----------|
| **Web (laptop demo)** | Use **Try Demo** or type. Mic shows a hint — voice is limited on web. |
| **Android/iOS build** | Mic records → `POST /api/google/speech` → needs `GOOGLE_API_KEY` for Gemini STT |

1. Set `GOOGLE_API_KEY` (section 1).
2. Build with EAS or `npx expo run:android` on a device.
3. Grant microphone permission when prompted.

**Code path:** `khidmat-ai/mobile/lib/voice.ts`, `backend/app/services/google_speech.py`

---

## 4. Agent reasoning “live” (Trace tab)

**Already in app:** Trace polls every **3 seconds** when **Live** is ON and a `session_id` exists from the last discover.

1. Run a search (Try Demo).
2. Open **Trace** tab → ensure **Live** toggle is on.
3. Optional: `GET /api/sessions/{session_id}/trace` returns updated steps after booking.

**Your side:** No extra key required; Gemini (section 1) makes reasoning text stronger.

**Code path:** `khidmat-ai/mobile/app/(tabs)/trace.tsx`, `backend/app/routers/sessions.py` (if present) / orchestrator trace store.

---

## 5. Twilio SMS OTP (real phone login)

**What it unlocks:** Real OTP SMS instead of demo `1234`.

1. [Twilio Console](https://console.twilio.com/) → Account SID, Auth Token, buy a PK-capable number.
2. In `backend/.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
```

3. Restart backend; Auth → Send OTP → check phone.

**Code path:** `backend/app/services/twilio_otp.py` (or auth router). Without keys, demo OTP **1234** always works.

---

## 6. WhatsApp / SMS after payment

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

**Code path:** `backend/app/services/notifications.py` — simulates messages when empty; logs appear in DB `notification_log`.

---

## 7. Stripe (real card charges)

```env
STRIPE_SECRET_KEY=sk_test_...
```

Demo flow uses `POST /api/payments/confirm` without live Stripe unless key is set.

---

## 8. Clerk (optional — not Firebase)

The repo uses **phone OTP + SQLite users**, with optional **Clerk** sync:

```env
CLERK_SECRET_KEY=sk_test_...
```

**Firebase Auth:** Not wired today. To add Firebase instead of Clerk:

1. Create Firebase project → Authentication → Phone.
2. Add `@react-native-firebase/auth` or `expo-firebase` to mobile.
3. Replace `lib/auth.ts` session with Firebase ID token.
4. Add backend middleware to verify Firebase JWT and map `uid` → `users.id`.

**Recommendation for hackathon:** Keep current OTP demo; mention Firebase as Phase 2 in the pitch.

---

## 9. Mobile env (device / deployed API)

`khidmat-ai/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:8000
```

For production:

```env
EXPO_PUBLIC_API_URL=https://your-api.railway.app
```

Rebuild or restart Expo after changing.

---

## 10. Previously contacted workers

**No key needed.** After you complete at least one booking:

- Home shows **Previously contacted** with **Call** and **Rebook**.
- Search dropdown also lists them.
- API: `GET /api/users/{user_id}/contacted`

---

## 11. Delete account

**Wired in app:** Profile → Delete Account → `DELETE /api/users/{user_id}`.

Removes saved workers and ratings; anonymizes bookings. Restart auth after delete.

---

## 12. Deploy checklist (judges on their phones)

1. Deploy backend (Railway/Render) with all `.env` keys.
2. Set `EXPO_PUBLIC_API_URL` to public HTTPS URL.
3. `eas build` or host Expo web at a stable URL.
4. Record 3–5 min demo video (see `docs/DEMO_CHECKLIST.md`).

---

## What’s still optional in the UI

| Item | Status |
|------|--------|
| Light theme on every screen | Main flows done; minor components may lag |
| Card scan on Add Card | Toast placeholder |
| Provider WhatsApp app | API only: `POST /api/provider/jobs/{id}/respond` |
| Web admin dashboard | Optional PRD deliverable |

---

## Priority order for hackathon day

1. `GOOGLE_API_KEY` — best ROI for AI + trace story  
2. Rehearse **Try Demo** + Trace **Live**  
3. `GOOGLE_MAPS_API_KEY` — if you have time  
4. Deploy API + public URL  
5. Demo video  
6. Twilio / Stripe / Firebase — only if required by judges  
