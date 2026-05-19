import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '../../constants/theme';
import { fonts } from '../../constants/theme';
import { useTheme } from '../../lib/ThemeContext';

type Variant = 'violet' | 'jade' | 'amber' | 'gray' | 'rose';

export default function Badge({ label, variant = 'violet' }: { label: string; variant?: Variant }) {
  const { colors } = useTheme();
  const styles = useMemo(() => badgeStyles(colors), [colors]);

  return (
    <View style={[styles.base, styles[variant]]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

function badgeStyles(colors: AppColors) {
  return StyleSheet.create({
    base: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
    },
    violet: { backgroundColor: colors.violetSoft, borderColor: colors.border2 },
    jade: { backgroundColor: colors.jadeSoft, borderColor: colors.jade },
    amber: { backgroundColor: colors.amberSoft, borderColor: colors.amber },
    gray: { backgroundColor: colors.surface, borderColor: colors.border },
    rose: { backgroundColor: colors.roseSoft, borderColor: colors.rose },
    text: { fontSize: 11, fontWeight: '600', fontFamily: fonts.body },
    text_violet: { color: colors.primaryText },
    text_jade: { color: colors.jade },
    text_amber: { color: colors.amber },
    text_gray: { color: colors.text2 },
    text_rose: { color: colors.rose },
  });
}
