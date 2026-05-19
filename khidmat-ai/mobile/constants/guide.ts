export type OnboardingStep = {
  icon: string;
  title: string;
  body: string;
  bullets?: string[];
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: '⚡',
    title: 'Welcome to KhidmatAI',
    body: 'Book home services in Urdu or English — by voice or typing. AI finds the best verified pros near you.',
    bullets: ['AC, plumber, electrician, cleaner & more', 'Powered by Google AI'],
  },
  {
    icon: '🏠',
    title: 'Home — start a booking',
    body: 'Describe what you need on the Home tab. Fastest way: tap Try Demo for a full example.',
    bullets: [
      '🎤 Mic — speak your request (phone app)',
      '✏️ Type in Urdu/English in the box',
      '⚡ Try Demo — instant sample booking',
      '📍 Book Now — search with your text',
    ],
  },
  {
    icon: '⭐',
    title: 'Results & confirm',
    body: 'AI ranks providers by skill, speed & value. Tap a card for details, then Book to confirm.',
    bullets: [
      '⭐ Top Match = best overall pick',
      'Score bars: 🟣 Skill · 🟠 Speed · 🟢 Value',
      'Leave a review after your job',
    ],
  },
  {
    icon: '🧭',
    title: 'Navigate the app',
    body: 'Use the bottom bar anytime:',
    bullets: [
      '🏠 Home — new bookings',
      '📋 Bookings — upcoming & past jobs',
      '🧠 Trace — see how AI chose your pro',
      '👤 Profile — account, help & logout',
    ],
  },
];

export const TAB_HINTS: Record<string, string> = {
  Home: 'Book services',
  Bookings: 'Your jobs',
  Trace: 'AI reasoning',
  Profile: 'Help & account',
};

export const EXAMPLE_PHRASES = [
  {
    id: 'ac',
    emoji: '❄️',
    label: 'AC repair G-13',
    urdu: 'AC theek karwana hai',
    text: 'Mujhe kal subah G-13 mein AC technician chahiye',
  },
  {
    id: 'plumber',
    emoji: '🔧',
    label: 'Urgent plumber',
    urdu: 'Plumber jaldi chahiye',
    text: 'F-7 mein plumber urgent — pipe leak hai',
  },
  {
    id: 'electric',
    emoji: '💡',
    label: 'Electrician today',
    urdu: 'Bijli ka kaam',
    text: 'DHA mein electrician chahiye aaj sham',
  },
  {
    id: 'clean',
    emoji: '🧹',
    label: 'House cleaning',
    urdu: 'Ghar ki safai',
    text: 'Kal subah G-13 mein deep cleaning chahiye',
  },
] as const;

export const NAV_SHORTCUTS = [
  { icon: '📋', label: 'Bookings', route: '/(tabs)/bookings' },
  { icon: '🧠', label: 'AI Trace', route: '/(tabs)/trace' },
  { icon: '📖', label: 'Help', route: '/(tabs)/profile' },
] as const;

export const BOOKING_FLOW = [
  { step: 'Request', hint: 'Describe your need — voice, text, or Try Demo' },
  { step: 'Match', hint: 'AI ranks providers — pick one and continue' },
  { step: 'Pay', hint: 'Pay securely — SMS & WhatsApp alerts after payment' },
  { step: 'Done', hint: 'Rate your provider and track in Bookings' },
] as const;

export const HOW_TO_SECTIONS = [
  {
    title: '1. Book a service',
    steps: [
      'Open Home and type what you need (e.g. “AC repair in G-13 tomorrow”).',
      'Or tap ⚡ Try Demo to run a sample booking instantly.',
      'Tap 📍 Book Now — AI agents find matching providers.',
    ],
  },
  {
    title: '2. Pick a provider',
    steps: [
      'On Results, ⭐ Top Match is the AI’s best pick.',
      'Tap any card to open the provider profile.',
      'Tap Book to confirm — you’ll get a booking code.',
    ],
  },
  {
    title: '3. Track & manage',
    steps: [
      '📋 Bookings — see upcoming, past, or cancelled jobs.',
      '🧠 Trace — step-by-step AI reasoning for your last search.',
      'Rate your provider on the confirmation screen.',
    ],
  },
  {
    title: '4. Tips',
    steps: [
      'Include area + urgency: “plumber F-7 urgent”.',
      'Guest login works offline-style; OTP login saves bookings to your account.',
      'Tap ❓ on Home anytime to replay this guide.',
    ],
  },
];
