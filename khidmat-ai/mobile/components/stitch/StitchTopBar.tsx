import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';

export default function StitchTopBar({
  name,
  onSettings,
}: {
  name: string;
  onSettings?: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.greet}>Assalamu Alaikum 👋</Text>
        <Text style={styles.name}>{name}</Text>
      </View>
      <Pressable style={styles.gear} onPress={onSettings} accessibilityLabel="Settings">
        <Text style={styles.gearIcon}>⚙️</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  greet: { fontSize: 13, color: colors.text2, fontFamily: fonts.body },
  name: { fontSize: 20, fontWeight: '700', color: colors.text, fontFamily: fonts.display, marginTop: 2 },
  gear: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: { fontSize: 20 },
});
