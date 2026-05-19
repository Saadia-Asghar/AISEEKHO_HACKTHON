import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '../constants/theme';
import { fonts, radius, spacing } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';
import type { PriceSort } from '../lib/bookingPrefs';

const OPTIONS: { key: PriceSort; label: string; hint: string }[] = [
  { key: 'smart', label: 'Best match', hint: 'AI score' },
  { key: 'low', label: 'Lowest ₹', hint: 'Budget' },
  { key: 'high', label: 'Premium ₹', hint: 'Top tier' },
];

export default function PriceSortChips({
  value,
  onChange,
}: {
  value: PriceSort;
  onChange: (v: PriceSort) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => chipStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Sort by charges</Text>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const on = opt.key === value;
          return (
            <Pressable
              key={opt.key}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => onChange(opt.key)}
            >
              <Text style={[styles.label, on && styles.labelOn]}>{opt.label}</Text>
              <Text style={[styles.hint, on && styles.hintOn]}>{opt.hint}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function chipStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.sm },
    title: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.text3,
      marginBottom: 8,
      fontFamily: fonts.body,
    },
    row: { flexDirection: 'row', gap: 8 },
    chip: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
    },
    chipOn: {
      borderColor: colors.violet,
      backgroundColor: colors.violetSoft,
    },
    label: { fontSize: 12, fontWeight: '700', color: colors.text2, fontFamily: fonts.body },
    labelOn: { color: colors.primaryText },
    hint: { fontSize: 9, color: colors.text3, marginTop: 2, fontFamily: fonts.body },
    hintOn: { color: colors.text2 },
  });
}
