import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '../../constants/theme';
import { fonts, radius, spacing } from '../../constants/theme';
import { useTheme } from '../../lib/ThemeContext';

export default function StitchFilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => pillStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {options.map((o) => {
        const on = value === o.key;
        return (
          <Pressable
            key={o.key}
            style={[styles.pill, on && styles.pillOn]}
            onPress={() => onChange(o.key)}
          >
            <Text style={[styles.text, on && styles.textOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function pillStyles(colors: AppColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg },
    pill: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border2,
      alignItems: 'center',
    },
    pillOn: { backgroundColor: colors.violet, borderColor: colors.violet },
    text: { fontSize: 13, fontWeight: '600', color: colors.text2, fontFamily: fonts.body },
    textOn: { color: colors.onPrimaryContainer },
  });
}
