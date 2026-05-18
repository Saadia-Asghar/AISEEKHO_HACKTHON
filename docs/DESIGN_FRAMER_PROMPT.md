# KhidmatAI — Framer Wireframer prompts

Framer Wireframer builds **websites only**. Use these as **390px mobile-first web** prototypes (not native app export). Match the real app in `khidmat-ai/mobile`.

## Design tokens

| Token | Hex |
|-------|-----|
| Background | `#09090B` |
| Surface | `#18181B` |
| Card | `#1C1C1E` |
| Primary | `#7C3AED` |
| Accent | `#F97316` |
| Success | `#10B981` |
| Text | `#FAFAFA` |
| Muted | `#71717A` |
| Border | `#27272A` |
| Error | `#EF4444` |

---

## Master prompt (paste into Framer)

```
Create a mobile-first web prototype ONLY — max width 390px, centered on canvas, dark mode. 
No desktop layout. Product: "KhidmatAI" — AI home services for Pakistan (plumber, AC, electrician). 
Tagline: "Bolein, Hum Karein". Small footer badge: "Powered by Google".

GLOBAL: Background #09090B, cards #1C1C1E, primary buttons #7C3AED, accent #F97316, 
text #FAFAFA, muted #71717A, borders #27272A, radius 16–24px, modern sans-serif.

FIXED BOTTOM NAV (always visible): 4 items with emoji — 🏠 Home | 📋 Bookings | 🧠 Trace | 👤 Profile. 
Active tab: purple text + subtle purple top indicator. Inactive: grey.

PAGE 1 — AUTH (default view): Centered. Logo text "KhidmatAI" bold 28px. 
Subtitle "Sign in with phone · Powered by Google". Card row: 🇵🇰 +92 + phone input placeholder "3XX XXXXXXX". 
Purple full-width button "Send OTP". Alternate state below fold: label "Demo OTP: 1234", 
four square OTP inputs in a row, purple "Verify" button.

PAGE 2 — HOME: Top bar "Assalamu Alaikum 👋 Ahmed" left, ⚙️ right. 
Hero: 88px circle with 🎤, purple glowing border (pulse feel). 
Caption: "Tap mic — Google speech-to-text". 
Large textarea placeholder "What service do you need?". 
Orange outline button "Try Demo". Horizontal scroll row of chips: 
⚡AC Tech 🔧Plumber 💡Electrician 🧹Cleaner 🎨Painter 📚Tutor (one chip highlighted purple border). 
Three small grey pills "recent searches". Full-width purple "Book Now". 
OPTIONAL overlay variant: 50% dark veil + text "AI agents working…" + 3 shimmer bars.

PAGE 3 — RESULTS: Small back link. Section "Top match" — card purple border, 
avatar circle with initials "AK", name bold, line "⭐ 4.8 · 📍 2.1 km · 💰 1500–2500 PKR", 
green "✓ Verified", horizontal bar split purple/orange/green labeled 40% dist / 35% rating / 25% avail. 
Section "Alternatives" — two smaller muted cards same layout. 
Purple "Book Now" full width. Orange text link "View Agent Reasoning".

PAGE 4 — BOOKING CONFIRM: Large green ✓ in circle (success). Title "Booking confirmed!". 
Card: provider name, service, 📅 slot, 🔑 KHI-20260518-042 purple. 
Box "Rate your provider" with 5 stars, comment field, orange "Submit review". 
Outline buttons: Set Reminder, View Full Trace. Purple "Back to Home".

PAGE 5 — TRACE: Top muted badge "🤖 Gemini intent · Google Maps discovery", 
"Copy Trace" button right. Vertical timeline 6 items: 
🧠 Intent, 🔍 Discovery, ⚖️ Ranking, 📅 Booking, 🔔 Follow-up, 📋 Summary — 
each with green circle, title, time, grey expandable text card.

PAGE 6 — BOOKINGS: Three pills Upcoming (active purple) | Past | Cancelled. 
Cards with emoji 🔧, service name, provider, date, green status badge PENDING. 
Row links Cancel (red) Rebook (purple). Empty state: 📋 "No bookings yet" + purple "Find a Service".

PAGE 7 — PROFILE: Centered avatar 72px initials, name, phone. 
Rows: Language "English ↔ اردو", My Reviews "3", Help ›. Red centered Logout.

PAGE 8 — PROVIDER: Back link. Large avatar, name, ⭐ rating, area, phone. 
Section Reviews with 2 review cards (stars + comment).

Link pages via bottom nav and primary CTAs. Smooth, premium, hackathon-ready.
```

---

## Follow-up prompts (one section at a time if Framer refuses)

### Auth only
```
Mobile-first 390px dark auth screen for KhidmatAI. Purple brand #7C3AED on #09090B. 
Phone +92 input card, Send OTP button, 4 OTP boxes, Verify button. Centered, minimal.
```

### Home only
```
Mobile-first 390px dark home screen KhidmatAI. Greeting Assalamu Alaikum, pulsing purple mic circle, 
search box, Try Demo orange outline, horizontal service chips, Book Now purple CTA, fixed bottom nav.
```

### Results + Confirm
```
Mobile-first 390px: Results page with top provider card, 3-segment score bar, alternatives, Book Now. 
Second frame: booking confirmed with green checkmark, KHI code, star rating form.
```

### Trace timeline
```
Mobile-first 390px dark agent trace page. Vertical timeline 6 steps with emoji icons, 
green completed circles, expandable reasoning cards, Copy Trace button, Google badge.
```

---

## Map to real app routes

| Framer page | Expo route |
|-------------|------------|
| Auth | `app/auth.tsx` |
| Home | `app/(tabs)/index.tsx` |
| Bookings | `app/(tabs)/bookings.tsx` |
| Trace | `app/(tabs)/trace.tsx` |
| Profile | `app/(tabs)/profile.tsx` |
| Results | `app/results.tsx` |
| Booking Confirm | `app/booking-confirm.tsx` |
| Provider | `app/provider/[id].tsx` |

---

## Figma alternative (native mobile)

If using Figma instead of Framer, use frame **390×844** and say **"native iOS mobile app"** not website. See full flow in `docs/UI_UX_FLOW.md` (create alongside if needed).
