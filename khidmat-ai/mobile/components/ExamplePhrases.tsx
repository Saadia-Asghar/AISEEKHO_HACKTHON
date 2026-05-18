import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { EXAMPLE_PHRASES } from '../constants/guide';

export default function ExamplePhrases({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Try saying (tap to use)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {EXAMPLE_PHRASES.map((p) => (
          <Pressable key={p.id} style={styles.chip} onPress={() => onSelect(p.text)}>
            <Text style={styles.emoji}>{p.emoji}</Text>
            <View style={styles.textCol}>
              <Text style={styles.en} numberOfLines={1}>
                {p.label}
              </Text>
              <Text style={styles.ur} numberOfLines={1}>
                {p.urdu}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text3,
    marginBottom: 8,
    fontFamily: fonts.body,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.r,
    marginRight: 8,
    maxWidth: 220,
  },
  emoji: { fontSize: 18 },
  textCol: { flex: 1 },
  en: { fontSize: 12, fontWeight: '600', color: colors.text, fontFamily: fonts.body },
  ur: { fontSize: 11, color: colors.text3, marginTop: 2, fontFamily: fonts.body },
});
