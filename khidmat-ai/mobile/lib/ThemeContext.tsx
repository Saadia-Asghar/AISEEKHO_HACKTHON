import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { darkColors, lightColors, type AppColors } from '../constants/theme';
import { getColorScheme, setColorScheme, type ColorScheme } from './themePrefs';

type ThemeCtx = {
  scheme: ColorScheme;
  colors: AppColors;
  isDark: boolean;
  setScheme: (s: ColorScheme) => Promise<void>;
  toggleScheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<ColorScheme>('dark');

  useEffect(() => {
    getColorScheme().then(setSchemeState);
  }, []);

  const setScheme = useCallback(async (s: ColorScheme) => {
    await setColorScheme(s);
    setSchemeState(s);
  }, []);

  const toggleScheme = useCallback(async () => {
    const next = scheme === 'dark' ? 'light' : 'dark';
    await setScheme(next);
  }, [scheme, setScheme]);

  const colors = scheme === 'light' ? lightColors : darkColors;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', scheme);
    document.documentElement.style.colorScheme = scheme;
    document.body.style.backgroundColor = colors.bg;
    const root = document.getElementById('root');
    if (root) root.style.backgroundColor = colors.bg;
  }, [scheme, colors.bg]);

  const value = useMemo(
    () => ({
      scheme,
      colors,
      isDark: scheme === 'dark',
      setScheme,
      toggleScheme,
    }),
    [scheme, colors, setScheme, toggleScheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme requires ThemeProvider');
  return ctx;
}
