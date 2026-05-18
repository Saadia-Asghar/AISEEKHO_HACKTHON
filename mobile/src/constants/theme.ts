export type ThemeMode = 'dark' | 'light';

export const BRAND = 'HazirAI';
export const TAGLINE = 'Bolein, Hum Karein';
export const TAGLINE_UR = 'بولیں، ہم کریں';
export const LOGO_PURPLE = '#6C3FE8';

const dark = {
  primary: '#6C3FE8',
  accent: '#F97316',
  logo: LOGO_PURPLE,
  bg: '#09090B',
  surface: '#18181B',
  card: '#27272A',
  text: '#FAFAFA',
  muted: '#71717A',
  dim: '#52525B',
  border: '#3F3F46',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  glow: 'rgba(108, 63, 232, 0.45)',
  glowSoft: 'rgba(108, 63, 232, 0.18)',
};

const light = {
  primary: '#6C3FE8',
  accent: '#F97316',
  logo: LOGO_PURPLE,
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  card: '#F4F4F5',
  text: '#09090B',
  muted: '#71717A',
  dim: '#A1A1AA',
  border: '#E4E4E7',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  glow: 'rgba(108, 63, 232, 0.35)',
  glowSoft: 'rgba(108, 63, 232, 0.12)',
};

export type ThemeColors = typeof dark;

export function getTheme(mode: ThemeMode): ThemeColors {
  return mode === 'light' ? light : dark;
}

export const RADIUS_XL = 16;
export const FONT_REGULAR = 'Inter_400Regular';
export const FONT_SEMIBOLD = 'Inter_600SemiBold';
export const FONT_BOLD = 'Inter_700Bold';

/** @deprecated use getTheme */
export const colors = dark;
