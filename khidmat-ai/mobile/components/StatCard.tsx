import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadows, spacing } from '../constants/theme';

export default function StatCard({
  icon,
  value,
  label,
  accent = colors.violetBright,
  onPress,
}: {
  icon: string;
  value: string;
  label: string;
  accent?: string;
  onPress?: () => void;
}) {
  const inner = (
    <>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </>
  );
  if (onPress) {
    return (
      <Pressable style={[styles.card, shadows.card]} onPress={onPress}>
        {inner}
      </Pressable>
    );
  }
  return <View style={[styles.card, shadows.card]}>{inner}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minHeight: 88,
    justifyContent: 'center',
  },
  icon: { fontSize: 22, marginBottom: 4 },
  value: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    color: colors.text3,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: fonts.body,
  },
});
