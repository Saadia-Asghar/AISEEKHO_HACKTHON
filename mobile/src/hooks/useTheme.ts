import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, ThemeMode, ThemeColors } from '../constants/theme';

type ThemeState = {
  mode: ThemeMode;
  colors: ThemeColors;
  ready: boolean;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  hydrate: () => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  colors: getTheme('dark'),
  ready: false,
  setMode: (mode) => {
    AsyncStorage.setItem('hazir_theme', mode);
    set({ mode, colors: getTheme(mode) });
  },
  toggle: () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    get().setMode(next);
  },
  hydrate: async () => {
    const stored = await AsyncStorage.getItem('hazir_theme');
    const mode = stored === 'light' ? 'light' : 'dark';
    set({ mode, colors: getTheme(mode), ready: true });
  },
}));

export function useTheme() {
  const mode = useThemeStore((s) => s.mode);
  const colors = useThemeStore((s) => s.colors);
  const toggle = useThemeStore((s) => s.toggle);
  const setMode = useThemeStore((s) => s.setMode);
  return { mode, colors, toggle, setMode };
}
