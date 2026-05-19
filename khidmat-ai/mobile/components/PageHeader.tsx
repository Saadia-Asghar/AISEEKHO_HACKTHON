import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';
import StitchAppHeader from './stitch/StitchAppHeader';

/** Stack screen header — Stitch style */
export default function PageHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  compact?: boolean;
}) {
  return (
    <>
      <StitchAppHeader onBack={onBack} right={right} />
      <View style={styles.wrap}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.sub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  title: { fontFamily: fonts.display, fontSize: 22, fontWeight: '700', color: colors.primaryText },
  sub: { fontSize: 13, color: colors.text2, marginTop: 6, fontFamily: fonts.body, lineHeight: 18 },
});
