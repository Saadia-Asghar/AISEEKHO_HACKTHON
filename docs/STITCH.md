# Google Stitch — KhidmatAI Mobile Service Hub

| | |
|--|--|
| **Project** | KhidmatAI Mobile Service Hub |
| **Project ID** | `10743790711138500902` |
| **Stitch URL** | https://stitch.withgoogle.com/projects/10743790711138500902 |
| **Local export** | `d:\project\stitch_khidmatai_mobile_service_hub.zip` |

## Local design export (recommended)

1. Place or keep `stitch_khidmatai_mobile_service_hub.zip` at the repo root.
2. Extract:

```powershell
Expand-Archive -Path "d:\project\stitch_khidmatai_mobile_service_hub.zip" `
  -DestinationPath "d:\project\khidmat-ai\mobile\design\stitch_khidmatai_mobile_service_hub" -Force
```

3. Reference HTML/PNG per screen under  
   `khidmat-ai/mobile/design/stitch_khidmatai_mobile_service_hub/stitch_khidmatai_mobile_service_hub/<screen>/`

## App mapping

| Stitch screen | Expo route |
|---------------|------------|
| Login / Authentication | `app/auth.tsx` |
| Home | `app/(tabs)/index.tsx` |
| Search results | `app/results.tsx` |
| Browse / categories | `app/browse.tsx` |
| Payment | `app/payment.tsx` |
| Booking confirmed | `app/booking-confirm.tsx` |
| Bookings | `app/(tabs)/bookings.tsx` |
| Trace | `app/(tabs)/trace.tsx` |
| Profile | `app/(tabs)/profile.tsx` |
| Provider | `app/provider/[id].tsx` |

## API (live Stitch pull)

If you have Google OAuth:

```powershell
$env:GOOGLE_ACCESS_TOKEN = gcloud auth print-access-token
.\scripts\fetch-stitch-project.ps1
```

## Run stack

```powershell
# Backend
cd d:\project\backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Mobile (web)
cd d:\project\khidmat-ai\mobile
$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"
npx expo start --web --port 8081
```

Guest: `+923000000000` / OTP `1234`
