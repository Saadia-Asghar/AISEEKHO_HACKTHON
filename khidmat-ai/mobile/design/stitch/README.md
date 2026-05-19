# Stitch design references

**Source:** `d:\project\stitch_khidmatai_mobile_service_hub.zip` (extracted)

**Extracted to:** `design/stitch_khidmatai_mobile_service_hub/stitch_khidmatai_mobile_service_hub/`

| Stitch folder | HTML | App route |
|---------------|------|-----------|
| `login_authentication` | ✓ | `app/auth.tsx` |
| `home_screen` | ✓ | `app/(tabs)/index.tsx` |
| `search_results` | ✓ | `app/results.tsx` |
| `detailed_search_results` | ✓ | `app/results.tsx` |
| `my_bookings` | PNG | `app/(tabs)/bookings.tsx` |
| `ai_trace_log` | PNG | `app/(tabs)/trace.tsx` |
| `user_profile` | PNG | `app/(tabs)/profile.tsx` |
| `provider_details` | PNG | `app/provider/[id].tsx` |
| `booking_confirmation` | PNG | `app/booking-confirm.tsx` |

Tokens: `constants/stitchDesign.ts` · Components: `components/stitch/*`

Re-extract zip:

```powershell
Expand-Archive -Path "d:\project\stitch_khidmatai_mobile_service_hub.zip" -DestinationPath "d:\project\khidmat-ai\mobile\design\stitch_khidmatai_mobile_service_hub" -Force
```
