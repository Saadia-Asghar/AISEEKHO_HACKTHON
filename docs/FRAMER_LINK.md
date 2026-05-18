# Design ↔ App integration

| | |
|--|--|
| **Framer (live)** | https://splendid-gibbon-403400.framer.app |
| **Editor** | https://framer.com/projects/Splendid-Gibbon--yocSa4NGRmxD5JPlxxnD-7tsI7 |
| **API** | `backend/` at repo root |
| **App** | `khidmat-ai/mobile/` |

## Screen map

| Framer | App file | Status |
|--------|----------|--------|
| [/](https://splendid-gibbon-403400.framer.app/) | `app/(tabs)/index.tsx` | Matched to published Framer |
| [/provider-detail](https://splendid-gibbon-403400.framer.app/provider-detail) | `app/provider/[id].tsx` | Matched |
| Auth | `app/auth.tsx` | App + API; publish Framer page to align |
| Results | `app/results.tsx` | App + API |
| Booking confirm | `app/booking-confirm.tsx` | App + API |
| Bookings | `app/(tabs)/bookings.tsx` | App + API |
| Trace | `app/(tabs)/trace.tsx` | App + API |
| Profile | `app/(tabs)/profile.tsx` | App + API |

## Preview

```powershell
.\scripts\preview.ps1
```

## Tokens

`khidmat-ai/mobile/constants/theme.ts` — `#09090B` `#7C3AED` `#F97316` `#10B981`
