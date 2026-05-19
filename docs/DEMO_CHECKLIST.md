# KhidmatAI — Demo checklist

## Run locally

```powershell
# Terminal 1
cd d:\project\backend
.\.venv\Scripts\Activate.ps1
python run.py

# Terminal 2
cd d:\project\khidmat-ai\mobile
$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"
npm run web
```

Open **http://localhost:8081** (not port 3000).

Guest login: **+923000000000** / OTP **1234**

---

## E2E flow (works today)

| Step | Screen | API |
|------|--------|-----|
| 1 | Auth / guest | `POST /api/auth/*` (demo OTP) |
| 2 | Home search or **Try Demo** | `POST /api/discover` |
| 3 | Results → pick provider | session in store |
| 4 | Payment → Pay | `POST /api/bookings/create` + `POST /api/payments/confirm` |
| 5 | Booking confirmed + review | `POST /api/reviews` |
| 6 | Bookings tab | `GET /api/bookings/user/:id` |
| 7 | Trace tab | trace from last discover |
| 8 | Profile → Payment methods | local saved cards UI |
| 9 | Browse categories | `GET /api/services/categories` → discover |

**5-agent orchestrator** runs on discover (intent → discovery → ranking → pricing → trace). Without `GOOGLE_API_KEY`, NLU/maps use fallbacks; **demo still works** with seeded providers.

---

## Light / dark mode

- Stitch light tokens: `stitch_khidmatai_mobile_service_hub/khidmatai/DESIGN.md`
- **Profile → Dark Mode** toggle: ON = dark, OFF = light (Stitch light `#f8f9fb` background)
- Themed: Home, Profile, tab bar, headers, glass cards, search box, chips, loading overlay, filters

Themed screens include Bookings, Trace, Results, Auth, Payment, Browse, booking-confirm, provider, payment-methods, add-card.

---

## Ready for demo

- Full booking path (search → pay → confirm)
- Bookings list + cancel
- AI trace log after search
- Filter dropdown (distance, rating, price, verified, today)
- Payment methods + add card (local)
- Urdu / English
- No “Stitch AI Integrated” banner

---

## Optional polish (not blocking demo)

| Item | Notes |
|------|--------|
| `GOOGLE_API_KEY` | Real Gemini intent + richer copy |
| `GOOGLE_MAPS_API_KEY` | Live map markers |
| Twilio / Clerk | Real SMS OTP + user sync |
| Stripe | Live card charges (demo payment API works) |
| Voice mic on web | Limited; typing + Try Demo fine |
| Delete account | UI only, no backend |
| Notifications / Privacy settings | Placeholder toasts |
| Light theme on every screen | Migrate remaining StyleSheets to `useTheme()` |
| Provider pixel-perfect | Stitch PNG tuning |
| Production deploy | EAS + env docs in repo |

---

## 3-minute demo script

1. Show **Home** → **Try Demo** → loading → **Results** (AI match, reasoning link).
2. **Book Now** → **Payment** → confirm → **Booking confirmed**.
3. **Bookings** tab → upcoming job.
4. **Trace** → agent steps.
5. **Profile** → toggle **Dark Mode** off → light UI → Payment methods.
