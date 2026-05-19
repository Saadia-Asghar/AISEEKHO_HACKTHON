import { Platform, ViewStyle } from 'react-native';

/** Google Stitch — KhidmatAI Mobile Service Hub */
export const stitch = {
  projectId: '10743790711138500902',
  projectUrl: 'https://stitch.withgoogle.com/projects/10743790711138500902',
  screens: {
    auth: '62d971c7f47c4dc3bc78e8f2695c851e',
  },
} as const;

export type AppColors = {
  bg: string;
  bgLowest: string;
  surface: string;
  surfaceLow: string;
  card: string;
  card2: string;
  glass: string;
  sheet: string;
  border: string;
  border2: string;
  violet: string;
  violetBright: string;
  primaryText: string;
  onPrimaryContainer: string;
  violetDeep: string;
  violetSoft: string;
  violetGlow: string;
  accent: string;
  accentSoft: string;
  coral: string;
  amber: string;
  amberSoft: string;
  jade: string;
  jadeSoft: string;
  rose: string;
  roseSoft: string;
  text: string;
  text2: string;
  text3: string;
  primary: string;
  success: string;
  muted: string;
  error: string;
  googleBlue: string;
  tabBar: string;
  switchTrackOff: string;
};

export const darkColors: AppColors = {
  bg: '#131315',
  bgLowest: '#0e0e10',
  surface: '#201f22',
  surfaceLow: '#1c1b1d',
  card: '#1C1C1E',
  card2: '#27272A',
  glass: 'rgba(28, 28, 30, 0.92)',
  sheet: '#18181B',
  border: '#27272A',
  border2: '#4a4455',
  violet: '#7C3AED',
  violetBright: '#d2bbff',
  primaryText: '#d2bbff',
  onPrimaryContainer: '#ede0ff',
  violetDeep: '#5B21B6',
  violetSoft: 'rgba(124,58,237,0.14)',
  violetGlow: 'rgba(124,58,237,0.35)',
  accent: '#F97316',
  accentSoft: 'rgba(249,115,22,0.12)',
  coral: '#F97316',
  amber: '#F97316',
  amberSoft: 'rgba(249,115,22,0.12)',
  jade: '#4edea3',
  jadeSoft: 'rgba(78,222,163,0.12)',
  rose: '#EF4444',
  roseSoft: 'rgba(239,68,68,0.12)',
  text: '#e5e1e4',
  text2: '#ccc3d8',
  text3: '#958da1',
  primary: '#7C3AED',
  success: '#4edea3',
  muted: '#958da1',
  error: '#ffb4ab',
  googleBlue: '#4285F4',
  tabBar: 'rgba(32, 31, 34, 0.92)',
  switchTrackOff: '#4a4455',
};

/** Stitch `khidmatai/DESIGN.md` light palette */
export const lightColors: AppColors = {
  bg: '#f8f9fb',
  bgLowest: '#ffffff',
  surface: '#edeef0',
  surfaceLow: '#f3f4f6',
  card: '#ffffff',
  card2: '#e7e8ea',
  glass: 'rgba(255, 255, 255, 0.92)',
  sheet: '#f3f4f6',
  border: '#e1e2e4',
  border2: '#ccc3d8',
  violet: '#7c3aed',
  violetBright: '#630ed4',
  primaryText: '#630ed4',
  onPrimaryContainer: '#ffffff',
  violetDeep: '#5a00c6',
  violetSoft: 'rgba(124,58,237,0.12)',
  violetGlow: 'rgba(124,58,237,0.18)',
  accent: '#ec6a06',
  accentSoft: 'rgba(236,106,6,0.12)',
  coral: '#ec6a06',
  amber: '#ec6a06',
  amberSoft: 'rgba(236,106,6,0.12)',
  jade: '#007650',
  jadeSoft: 'rgba(0,118,80,0.12)',
  rose: '#ba1a1a',
  roseSoft: 'rgba(186,26,26,0.1)',
  text: '#191c1e',
  text2: '#4a4455',
  text3: '#7b7487',
  primary: '#7c3aed',
  success: '#007650',
  muted: '#7b7487',
  error: '#ba1a1a',
  googleBlue: '#4285F4',
  tabBar: 'rgba(248, 249, 251, 0.96)',
  switchTrackOff: '#e1e2e4',
};

/** Default export for legacy imports — prefer `useTheme().colors` */
export const colors = darkColors;

export const radius = { sm: 8, md: 12, r: 12, lg: 16, xl: 20, xxl: 24, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const fonts = {
  display: Platform.select({ web: 'Inter, system-ui, sans-serif', default: 'System' }) as string,
  body: Platform.select({ web: 'Inter, system-ui, sans-serif', default: 'System' }) as string,
};

export const gradients = {
  hero: ['#7C3AED', '#9333EA', '#5B21B6'] as const,
  heroAlt: ['#7C3AED', '#F97316'] as const,
  violet: ['#7C3AED', '#5B21B6'] as const,
  jade: ['#10B981', '#059669'] as const,
  amber: ['#F97316', '#EA580C'] as const,
  mic: ['#8B5CF6', '#7C3AED', '#5B21B6'] as const,
};

export const shadows: Record<string, ViewStyle> = {
  card: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12 },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle,
  soft: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8 },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
};

/** Flat Stitch panel (no curved overlap) */
export const sheetCurve = {
  flex: 1,
  backgroundColor: darkColors.bg,
  paddingTop: spacing.sm,
};
