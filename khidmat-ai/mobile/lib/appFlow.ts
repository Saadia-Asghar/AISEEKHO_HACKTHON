/**
 * KhidmatAI end-to-end navigation (Expo Router)
 *
 * 1. Cold start → loading overlay → session check
 * 2. No session → /auth (OTP or guest)
 * 3. Authed → /(tabs) Home
 * 4. Home/Browse: describe service + filters → POST /api/discover → /results
 * 5. Results: pick provider → /payment → POST booking + /api/payments/confirm → /booking-confirm
 * 6. Bookings tab: GET /api/bookings/user/:id
 * 7. Trace tab: last discover trace from store
 * 8. Profile: settings, payment-methods, theme toggle
 * 9. Unknown route → /+not-found
 */

export const FLOW_ROUTES = {
  auth: '/auth',
  home: '/',
  browse: '/browse',
  results: '/results',
  payment: '/payment',
  paymentMethods: '/payment-methods',
  addCard: '/add-card',
  confirm: '/booking-confirm',
  provider: '/provider',
  notFound: '/+not-found',
} as const;
