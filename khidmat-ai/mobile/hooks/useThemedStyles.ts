import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { AppColors } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';

/** Rebuild StyleSheet when light/dark palette changes */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: AppColors) => T
): T {
  const { colors } = useTheme();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
}
