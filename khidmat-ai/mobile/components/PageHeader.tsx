import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';

/** Stitch flat header (stack screens) */
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
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable style={styles.back} onPress={onBack}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        {right}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.sub} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  back: { paddingVertical: 4 },
  backSpacer: { width: 60 },
  backText: { color: colors.primaryText, fontSize: 14, fontWeight: '600', fontFamily: fonts.body },
  title: { fontFamily: fonts.display, fontSize: 22, fontWeight: '700', color: colors.primaryText },
  sub: { fontSize: 13, color: colors.text2, marginTop: 6, fontFamily: fonts.body, lineHeight: 18 },
});
