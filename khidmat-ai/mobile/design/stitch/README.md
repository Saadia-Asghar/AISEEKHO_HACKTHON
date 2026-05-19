# Stitch → App screen map

Source: `d:\project\stitch_khidmatai_mobile_service_hub\` (repo root)  
Copy in app: `design/stitch_khidmatai_mobile_service_hub/`

| Stitch folder | Reference | Expo route | Status |
|---------------|-----------|------------|--------|
| `login_authentication` | `code.html` | `app/auth.tsx` | ✅ |
| `khidmatai_service_discovery_flow` | `code.html` (auth duplicate) | `app/auth.tsx` | ✅ |
| `home_screen` (root) | `code.html` | `app/(tabs)/index.tsx` | ✅ |
| `search_results` | `code.html` | `app/results.tsx` | ✅ |
| `detailed_search_results` | `code.html` | `app/results.tsx` | ✅ |
| `payment_methods` | `code.html` | `app/payment-methods.tsx` | ✅ |
| `add_new_card` | `code.html` | `app/add-card.tsx` | ✅ |
| `404_error_page` | `code.html` | `app/+not-found.tsx` | ✅ |
| `loading_state` | `code.html` | `components/stitch/StitchLoadingOverlay.tsx` | ✅ |
| `user_profile` / `(2)` export | `code.html` | `app/(tabs)/profile.tsx` | ✅ |
| `my_bookings` | PNG in full zip | `app/(tabs)/bookings.tsx` | ✅ |
| `ai_trace_log` | PNG in full zip | `app/(tabs)/trace.tsx` | ✅ |
| `provider_details` | PNG in full zip | `app/provider/[id].tsx` | ✅ |
| `booking_confirmation` | PNG in full zip | `app/booking-confirm.tsx` | ✅ |
| Checkout flow | — | `app/payment.tsx` | ✅ |
| Categories | — | `app/browse.tsx` | ✅ |

Shared Stitch components: `components/stitch/*`  
Tokens: `constants/stitchDesign.ts`, `constants/theme.ts`  
Saved cards: `lib/paymentMethods.ts`
