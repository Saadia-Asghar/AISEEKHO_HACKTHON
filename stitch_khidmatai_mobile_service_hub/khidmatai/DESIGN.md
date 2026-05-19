---
name: KhidmatAI
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#4a4455'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#7b7487'
  outline-variant: '#ccc3d8'
  surface-tint: '#732ee4'
  primary: '#630ed4'
  on-primary: '#ffffff'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#d2bbff'
  secondary: '#5c5f60'
  on-secondary: '#ffffff'
  secondary-container: '#e1e3e4'
  on-secondary-container: '#626566'
  tertiary: '#474e60'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f6678'
  on-tertiary-container: '#dfe5fa'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#e1e3e4'
  secondary-fixed-dim: '#c5c7c8'
  on-secondary-fixed: '#191c1d'
  on-secondary-fixed-variant: '#454748'
  tertiary-fixed: '#dce2f7'
  tertiary-fixed-dim: '#c0c6db'
  on-tertiary-fixed: '#141b2b'
  on-tertiary-fixed-variant: '#404758'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
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
  mono-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1440px
---

## Brand & Style
The design system for KhidmatAI is engineered for high-performance AI interfaces, blending technical precision with a premium, executive aesthetic. The brand personality is authoritative yet accessible, positioning itself as an essential tool for sophisticated workflows.

The design style utilizes a **Refined Glassmorphism** approach. It leverages translucent layers, subtle backdrop blurs, and high-precision borders to create a sense of depth and modularity. By balancing the "Geist" typeface's technical rigor with soft glass effects, the UI achieves a "Professional-Futuristic" tone that feels both cutting-edge and reliable.

## Colors
The color strategy transitions the product into a high-contrast, "Gallery White" environment. The palette emphasizes clarity and focus, using white and off-white surfaces to create an expansive feel.

- **Primary Purple (#7C3AED):** Retained as the signature action color. In light mode, it provides a striking focal point against the neutral background while maintaining AA accessibility for text and icons.
- **Surface Hierarchy:** The system uses `#FFFFFF` for main interaction areas and `#F3F4F6` (Surface-Dim) to differentiate background canvas layers or secondary sidebars.
- **Glass Effects:** Background blurs use a semi-transparent white base (`rgba(255, 255, 255, 0.7)`) to mimic frosted glass, allowing the primary purple or content colors to bleed through subtly without compromising legibility.

## Typography
This design system utilizes **Geist** exclusively to maintain a developer-friendly, technical aesthetic. The typographic scale is optimized for information density and hierarchy.

- **Tight Tracking:** Headlines use slight negative letter-spacing to appear more cohesive and impactful.
- **Variable Weights:** Bold weights are reserved for high-level semantic headers, while Medium weights are used for UI labels to ensure clarity against glass backgrounds.
- **Vertical Rhythm:** Line heights are strictly adhered to, ensuring a consistent 4px or 8px baseline alignment across all text blocks.

## Layout & Spacing
The layout follows a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

- **Spacing Rhythm:** All margins, paddings, and gaps are multiples of a 4px base unit. 
- **Modular Panels:** Content is organized into distinct panels (containers) that use a 24px gutter. 
- **Adaptive Reflow:** On mobile, sidebars collapse into a bottom sheet or a full-screen drawer to maximize the canvas for AI interactions.

## Elevation & Depth
Elevation in this design system is conveyed through **Tonal Stacking** and **Glassmorphism** rather than traditional heavy shadows.

- **Layer 0 (Canvas):** The base background color (`#F9FAFB`).
- **Layer 1 (Cards/Panels):** Pure white (`#FFFFFF`) with a 1px subtle border (`#111827` at 8% opacity).
- **Layer 2 (Floating/Overlays):** Translucent white with a `20px` backdrop blur. These elements use a dual-border technique: a 1px inner light border and a soft 4px ambient shadow (8% opacity, 4px blur) to separate them from the surface.

## Shapes
The design system employs a **Rounded (8px)** corner language. This radius is applied consistently to all primary UI components like cards, buttons, and input fields. 

- **Nested Proportions:** When elements are nested (e.g., a button inside a card), the inner radius should be reduced (usually 4px) to maintain visual harmony.
- **Large Components:** Hero sections or large modal containers may scale up to `rounded-xl` (24px) to emphasize the soft, premium feel.

## Components
- **Buttons:** Primary buttons use a solid purple (`#7C3AED`) background with white text. Secondary buttons use a white glass background with a subtle border and charcoal text.
- **Input Fields:** Use Surface-Bright (`#FFFFFF`) with a 1px border. On focus, the border transitions to Primary Purple with a 2px outer "glow" (8% opacity purple).
- **Cards:** Defined by a white background, 8px corner radius, and a subtle light-grey border. Cards should not have shadows unless they are interactive or draggable.
- **Chips/Tags:** Small, low-contrast pills (`rounded-full`) using Surface-Dim background and secondary text for metadata or categories.
- **Glass Panels:** Used for sidebars and navigation headers. Must include `backdrop-filter: blur(12px)` and a top/bottom border to define the edge against the canvas.