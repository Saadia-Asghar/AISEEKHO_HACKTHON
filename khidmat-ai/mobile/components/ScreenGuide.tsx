import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';
import StitchAppHeader from './stitch/StitchAppHeader';

/** Stitch tab/stack section header (replaces old gradient ScreenGuide) */
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

const styles = StyleSheet.create({
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
