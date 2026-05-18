import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadows, spacing } from '../constants/theme';

type Item = { label: string; emoji: string; phrase: string; hot?: boolean };

export default function ServiceGrid({
  items,
  onSelect,
}: {
  items: Item[];
  onSelect: (phrase: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Pressable
          key={item.label}
          style={[styles.tile, item.hot && styles.tileHot, shadows.soft]}
          onPress={() => onSelect(item.phrase)}
        >
          <View style={styles.iconWrap}>
            <Text style={styles.emoji}>{item.emoji}</Text>
          </View>
          <Text style={styles.label}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  tile: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
  },
  tileHot: {
    borderColor: 'rgba(123,94,167,0.4)',
    backgroundColor: colors.violetSoft,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emoji: { fontSize: 22 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: fonts.body,
  },
});
