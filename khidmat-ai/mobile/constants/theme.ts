import { Platform } from 'react-native';

/** Matches Framer / HTML prototype design tokens */
export const colors = {
  bg: '#0A0A0F',
  surface: '#111118',
  card: '#16161F',
  card2: '#1C1C27',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',
  violet: '#7B5EA7',
  violetBright: '#9B7FD4',
  violetSoft: 'rgba(123,94,167,0.12)',
  violetGlow: 'rgba(123,94,167,0.25)',
  amber: '#E8A838',
  amberSoft: 'rgba(232,168,56,0.12)',
  jade: '#2EC4A9',
  jadeSoft: 'rgba(46,196,169,0.12)',
  rose: '#E85D7A',
  roseSoft: 'rgba(232,93,122,0.12)',
  text: '#F4F1FF',
  text2: '#A09BC0',
  text3: '#5E5A78',
  /** Legacy aliases */
  primary: '#7B5EA7',
  accent: '#E8A838',
  success: '#2EC4A9',
  muted: '#5E5A78',
  error: '#E85D7A',
} as const;

export const radius = { sm: 8, md: 12, r: 14, lg: 18, xl: 24 } as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const fonts = {
  display: Platform.select({
    web: 'Clash Display, system-ui, sans-serif',
    default: 'System',
  }) as string,
  body: Platform.select({
    web: 'Plus Jakarta Sans, system-ui, sans-serif',
    default: 'System',
  }) as string,
};

export const gradients = {
  violet: ['#7B5EA7', '#5E3D8A'] as const,
  jade: ['#2EC4A9', '#1A9980'] as const,
  amber: ['#E8A838', '#B87E1A'] as const,
};
