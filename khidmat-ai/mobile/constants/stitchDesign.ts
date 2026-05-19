/** Tokens extracted from stitch_khidmatai_mobile_service_hub.zip (Stitch HTML exports) */
/** 1:1 map — folder name in stitch_khidmatai_mobile_service_hub → Expo route */
export const stitchScreens = {
  login_authentication: 'app/auth.tsx',
  khidmatai_service_discovery_flow: 'app/auth.tsx',
  home_screen: 'app/(tabs)/index.tsx',
  search_results: 'app/results.tsx',
  detailed_search_results: 'app/results.tsx',
  my_bookings: 'app/(tabs)/bookings.tsx',
  ai_trace_log: 'app/(tabs)/trace.tsx',
  user_profile: 'app/(tabs)/profile.tsx',
  provider_details: 'app/provider/[id].tsx',
  booking_confirmation: 'app/booking-confirm.tsx',
  payment: 'app/payment.tsx',
  browse: 'app/browse.tsx',
} as const;

export const stitchColors = {
  background: '#131315',
  backgroundLowest: '#0e0e10',
  surface: '#131315',
  surfaceContainer: '#201f22',
  surfaceContainerLow: '#1c1b1d',
  surfaceContainerHigh: '#2a2a2c',
  glassCard: 'rgba(28, 28, 30, 0.8)',
  primary: '#d2bbff',
  primaryContainer: '#7c3aed',
  onPrimaryContainer: '#ede0ff',
  secondary: '#ffb690',
  secondaryContainer: '#ec6a06',
  tertiary: '#4edea3',
  onSurface: '#e5e1e4',
  onSurfaceVariant: '#ccc3d8',
  outline: '#958da1',
  outlineVariant: '#4a4455',
  error: '#ffb4ab',
  accentOrange: '#F97316',
  verifiedGreen: '#10B981',
} as const;

export const stitchAssets = {
  featuredHero:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAX7bgW-0e4B11_iINc3tl9StUXmVNBoMqK35Lc9Q4mEPuQfm_fJBz76yFIM_4Q4HEj_P6MBOE1pnJfQhd9xD2uuogPuu6_MZABQ0FWYHlQfITKei-3I0d-5wDaSf3XKqtaAPUjbuRZXfjOnPAHuSF5JB_L7Mf9M_9kgkVfXPts7Ea_yt93qnL9Tu10zzL8YvjWJOGuhKQnQJRNrA6sI1xhH_bh6lMZF33fwUE3AWUn8byHOWXp-BGDNZBdj7jYV6chmm3JLOJZr1mk',
  authHero:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAW6-u6s7bnan8bZX0H0WAOO5Uf2jWKnD166uUdsHvP7pBA12CYLrgzlIgaYDcwfay3LICOEDtiMyHYEXKt0dnLtkRO7OxNtcSvOzX5MEVBBh5sJ5xtmyJa9AVK9ja7-A8b4nroAKBwDhyHhhgtPQukwOQhOTLKWsYHBQ1_5BDZ1-__yjf3BdzYPfHr740BUNDkeo2TZ3zu66-dsU1nKdW91lbMANtFsnUSqybbxZWpZgyRVjBS7VkjArVDGr_yIwGnDgrYC9I-5Oce',
} as const;

export const stitchDesignRoot =
  'design/stitch_khidmatai_mobile_service_hub/stitch_khidmatai_mobile_service_hub';
