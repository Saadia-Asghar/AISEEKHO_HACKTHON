import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../constants/theme';

export default function StitchMatchBadge({ pct = 98 }: { pct?: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.icon}>⚡</Text>
      <Text style={styles.text}>{pct}% Match</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.violet,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomLeftRadius: radius.lg,
  },
  icon: { fontSize: 12 },
  text: { fontSize: 11, fontWeight: '700', color: colors.onPrimaryContainer, fontFamily: fonts.body },
});
