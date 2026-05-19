import { type ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '../constants/theme';
import { fonts, spacing } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';
import StitchAppHeader from './stitch/StitchAppHeader';

export default function ScreenGuide({
  title,
  subtitle,
  onBack,
  onSettings,
  right,
}: {
  title: string;
  subtitle: string;
  onBack?: () => void;
  right?: ReactNode;
  onSettings?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => guideStyles(colors), [colors]);

  return (
    <>
      <StitchAppHeader onBack={onBack} onSettings={onSettings} right={right} />
      <View style={styles.wrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
    </>
  );
}

function guideStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: colors.bg,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 24,
      fontWeight: '600',
      color: colors.primaryText,
    },
    sub: {
      fontSize: 14,
      color: colors.text2,
      marginTop: 6,
      fontFamily: fonts.body,
      lineHeight: 20,
    },
  });
}
