import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { AppColors } from '../../constants/theme';
import { fonts, spacing } from '../../constants/theme';
import { useTheme } from '../../lib/ThemeContext';

export default function StitchSectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => labelStyles(colors), [colors]);
  return <Text style={styles.label}>{children}</Text>;
}

function labelStyles(colors: AppColors) {
  return StyleSheet.create({
    label: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.text2,
      marginBottom: spacing.sm,
      marginHorizontal: spacing.lg,
      fontFamily: fonts.body,
    },
  });
}
