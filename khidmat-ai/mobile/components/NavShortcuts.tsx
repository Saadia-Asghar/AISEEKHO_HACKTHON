import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { NAV_SHORTCUTS } from '../constants/guide';

export default function NavShortcuts() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Go to</Text>
      <View style={styles.row}>
        {NAV_SHORTCUTS.map((s) => (
          <Pressable
            key={s.route}
            style={styles.chip}
            onPress={() => router.push(s.route as '/(tabs)/bookings')}
          >
            <Text style={styles.icon}>{s.icon}</Text>
            <Text style={styles.name}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text3,
    marginBottom: 10,
    fontFamily: fonts.body,
  },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.r,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { fontSize: 20, marginBottom: 4 },
  name: { fontSize: 11, fontWeight: '600', color: colors.text2, fontFamily: fonts.body },
});
