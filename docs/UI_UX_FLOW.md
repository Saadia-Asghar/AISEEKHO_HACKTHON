# KhidmatAI — UI/UX flow (Figma / product)

## Navigation

- **Stack:** Auth → Tabs (Home, Bookings, Trace, Profile) + Results + Booking Confirm + Provider
- **Auth gate:** no token → `/auth`

## Flows

1. **Onboard:** Phone → OTP `1234` → Home  
2. **Book:** Home (text / mic / demo) → shimmer → Results → Book Now → Confirm → review → Home  
3. **Trace:** Results or Confirm → Trace tab (6-step timeline)  
4. **Bookings:** Tab → Upcoming / Past / Cancelled → cancel or rebook  
5. **Profile:** Language, reviews, logout  

## Screens

| Screen | Key UI |
|--------|--------|
| Auth | +92 phone, 4 OTP boxes |
| Home | Mic pulse, chips, Book Now, AI loading overlay |
| Results | Top match + 2 alts, score bar, Book Now |
| Confirm | ✓ animation, KHI code, stars + review |
| Trace | Timeline, Copy Trace, Google badge |
| Bookings | 3 tabs, cards, empty state |
| Profile | Avatar, language, reviews, logout |
| Provider | Profile + reviews list |

## Theme

`#09090B` bg · `#7C3AED` primary · `#F97316` accent · `#10B981` success
