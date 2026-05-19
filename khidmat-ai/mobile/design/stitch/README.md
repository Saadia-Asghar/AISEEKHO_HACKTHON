# Stitch → App screen map

Source zip: `d:\project\stitch_khidmatai_mobile_service_hub.zip`  
Extracted: `design/stitch_khidmatai_mobile_service_hub/stitch_khidmatai_mobile_service_hub/`

| Stitch folder | Reference | Expo route | Status |
|---------------|-----------|------------|--------|
| `login_authentication` | `code.html` + `screen.png` | `app/auth.tsx` | ✅ |
| `khidmatai_service_discovery_flow` | `code.html` (auth variant) | `app/auth.tsx` | ✅ |
| `home_screen` | `code.html` + `screen.png` | `app/(tabs)/index.tsx` | ✅ |
| `search_results` | `code.html` + `screen.png` | `app/results.tsx` | ✅ |
| `detailed_search_results` | `code.html` + `screen.png` | `app/results.tsx` | ✅ |
| `my_bookings` | `screen.png` | `app/(tabs)/bookings.tsx` | ✅ |
| `ai_trace_log` | `screen.png` | `app/(tabs)/trace.tsx` | ✅ |
| `user_profile` | `screen.png` | `app/(tabs)/profile.tsx` | ✅ |
| `provider_details` | `screen.png` | `app/provider/[id].tsx` | ✅ |
| `booking_confirmation` | `screen.png` | `app/booking-confirm.tsx` | ✅ |
| *(payment — in flow, no separate export)* | — | `app/payment.tsx` | ✅ |
| *(browse — categories)* | — | `app/browse.tsx` | ✅ |

Shared Stitch components: `components/stitch/*`  
Tokens: `constants/stitchDesign.ts`, `constants/theme.ts`
