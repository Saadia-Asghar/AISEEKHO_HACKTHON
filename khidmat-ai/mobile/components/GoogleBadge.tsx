import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';

export default function GoogleBadge({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <Text style={styles.g}>G</Text>
      <Text style={styles.text}>Powered by Google</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.card,
    marginVertical: spacing.sm,
  },
  compact: { marginVertical: 0 },
  g: { fontSize: 13, fontWeight: '800', color: '#4285F4' },
  text: { color: colors.text2, fontSize: 11, fontWeight: '600', fontFamily: fonts.body },
});
