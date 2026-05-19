import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

type Chip = { id?: string; label: string; emoji: string; hot?: boolean };

export default function StitchChipScroll({
  chips,
  onSelect,
}: {
  chips: Chip[];
  onSelect: (chip: Chip) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips.map((c) => (
        <Pressable
          key={c.id || c.label}
          style={[styles.chip, c.hot && styles.chipHot]}
          onPress={() => onSelect(c)}
        >
          <Text style={styles.chipText}>
            {c.emoji} {c.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, gap: 8, paddingBottom: spacing.md },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border2,
  },
  chipHot: { borderColor: colors.primaryText, backgroundColor: colors.violetSoft },
  chipText: { fontSize: 14, fontWeight: '500', color: colors.text, fontFamily: fonts.body },
});
