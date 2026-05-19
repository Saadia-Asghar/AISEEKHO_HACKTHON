import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { AppColors } from '../../constants/theme';
import { fonts, spacing } from '../../constants/theme';
import { useTheme } from '../../lib/ThemeContext';

export default function SecLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => labelStyles(colors), [colors]);
  return <Text style={styles.label}>{children}</Text>;
}

function labelStyles(colors: AppColors) {
  return StyleSheet.create({
    label: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.text3,
      marginBottom: 10,
      marginHorizontal: spacing.lg,
      fontFamily: fonts.body,
    },
  });
}
