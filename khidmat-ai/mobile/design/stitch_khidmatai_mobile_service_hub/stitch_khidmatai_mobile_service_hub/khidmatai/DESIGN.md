---
name: KhidmatAI
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#ffb690'
  on-secondary: '#552100'
  secondary-container: '#ec6a06'
  on-secondary-container: '#4a1c00'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#007650'
  on-tertiary-container: '#76ffc2'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-padding: 20px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

This design system embodies a premium, high-tech aesthetic tailored for the modern service economy. It merges **Minimalism** with **Glassmorphism** to create a sophisticated, "hackathon-ready" interface that feels both cutting-edge and dependable. 

The visual language focuses on depth through dark-mode layering, using vibrant purple and orange accents to guide the user's eye toward AI-driven actions. The emotional response should be one of "effortless command"—the feeling that premium home services are just a high-tech whisper away.

## Colors

The palette is rooted in a deep, "obsidian" dark mode. 
- **Primary (Purple):** Used for primary actions, active states, and AI-related branding.
- **Accent (Orange):** Reserved for highlights, special offers, and attention-grabbing tags.
- **Success (Green):** Used exclusively for confirmed bookings and completed payments.
- **Neutrals:** A tiered system of dark greys creates depth. Backgrounds use the darkest value, while surfaces and cards step up in luminosity to create a clear visual hierarchy.

## Typography

The design system utilizes **Geist** for its technical precision and modern, developer-centric feel. 
- **Headlines:** Use tight letter-spacing and heavy weights to convey authority.
- **Body:** Standardized for high legibility against dark backgrounds; ensure ample line height to prevent "bleeding" of white text on black.
- **Labels:** Use medium or semi-bold weights to ensure functional UI elements (like price tags or category chips) remain distinct.

## Layout & Spacing

This design system is **mobile-first**, optimized for a **390px width**. 
- **Grid:** A 4-column fluid grid for mobile with 16px gutters and 20px side margins.
- **Alignment:** Content is primarily centered to maintain focus on the "Service Request" flow.
- **Rhythm:** An 8px linear scale is used for vertical rhythm, ensuring consistent gaps between service categories and list items.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Glassmorphism**:
- **Level 0 (Background):** #09090B.
- **Level 1 (Cards/Lists):** #1C1C1E with a 1px solid border (#27272A).
- **Level 2 (Modals/Overlays):** #18181B with a subtle backdrop blur (20px) and a purple-tinted ambient shadow.
- **Glow Effects:** Critical AI elements (like the mic button) utilize a primary color outer glow (`drop-shadow: 0 0 15px rgba(124, 58, 237, 0.5)`) to simulate a "powered-on" state.

## Shapes

The shape language is friendly yet structured. 
- **Cards & Primary Containers:** Use 24px corner radius (`rounded-xl` equivalent in this system) to create a premium, "container-less" feel.
- **Buttons & Inputs:** Use 16px corner radius.
- **Chips:** Use full-pill rounding for high contrast against the squared-off grid.

## Components

### AI Voice Interaction (Mic Button)
A floating, circular button with a fixed position. It features a deep purple gradient and a pulsating outer glow. In an active state, it uses a shimmering "mesh gradient" overlay.

### Bottom Navigation
A fixed, glassmorphic bar with `backdrop-filter: blur(12px)`. Icons use a dual-tone style: muted for inactive, primary purple with a subtle glow for active.

### Service Cards
A stacked layout featuring a high-quality image with a 24px radius, followed by a headline and a secondary-colored "Book Now" label. Background is #1C1C1E.

### Input Fields
Darker than the surface (#09090B), featuring a 1px border that glows purple on focus. Typography within inputs should be `body-md`.

### Shimmering States
Loading states must use a linear-gradient shimmer (from #1C1C1E to #27272A and back) moving left-to-right at a 45-degree angle.

### Chips/Badges
Small, high-contrast elements with 100px radius. Use #F97316 for "Express" services and #10B981 for "Verified" pros.