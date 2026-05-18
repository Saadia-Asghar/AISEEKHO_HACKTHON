import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../constants/theme';

const CATEGORIES = [
  { label: 'AC', emoji: '⚡', from: '2,500', phrase: 'AC technician' },
  { label: 'Plumber', emoji: '🔧', from: '1,500', phrase: 'plumber' },
  { label: 'Electric', emoji: '💡', from: '1,200', phrase: 'electrician' },
  { label: 'Cleaner', emoji: '🧹', from: '1,800', phrase: 'cleaner' },
  { label: 'Painter', emoji: '🎨', from: '2,000', phrase: 'painter' },
  { label: 'Tutor', emoji: '📚', from: '1,000', phrase: 'tutor' },
];

type Props = { onSelect: (phrase: string) => void; disabled?: boolean };

export default function CategoryGrid({ onSelect, disabled }: Props) {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((c) => (
        <Pressable
          key={c.label}
          style={styles.cell}
          disabled={disabled}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(`I need a ${c.phrase} in G-13`);
          }}
        >
          <Text style={styles.emoji}>{c.emoji}</Text>
          <Text style={styles.label}>{c.label}</Text>
          <Text style={styles.from}>from {c.from} PKR</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  cell: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emoji: { fontSize: 22 },
  label: { color: colors.text, fontWeight: '700', fontSize: 12, marginTop: 4 },
  from: { color: colors.muted, fontSize: 10, marginTop: 2 },
});
