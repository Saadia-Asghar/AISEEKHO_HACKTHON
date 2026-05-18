import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, gradients, spacing } from '../constants/theme';

export default function PageHeader({
  title,
  subtitle,
  onBack,
  right,
  compact,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  compact?: boolean;
}) {
  return (
    <LinearGradient colors={[...gradients.hero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, compact && styles.heroCompact]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable style={styles.back} onPress={onBack} accessibilityRole="button">
            <Text style={styles.backText}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.sub} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ?? <View style={styles.backSpacer} />}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: 36,
  },
  heroCompact: { paddingBottom: 28 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: { width: 40 },
  backText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  titles: { flex: 1, paddingTop: 4 },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  sub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    lineHeight: 18,
    fontFamily: fonts.body,
  },
});
