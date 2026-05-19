import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AppColors } from '../constants/theme';
import { fonts } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';

type Props = {
  distance: number;
  rating: number;
  availability: number;
};

function Legend({
  dot,
  label,
  styles,
}: {
  dot: string;
  label: string;
  styles: ReturnType<typeof scoreStyles>;
}) {
  return (
    <View style={styles.legend}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function ScoreBar({ distance, rating, availability }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => scoreStyles(colors), [colors]);
  const total = Math.max(distance + rating + availability, 0.01);
  const w1 = distance / total;
  const w2 = rating / total;
  const w3 = availability / total;
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <View style={[styles.seg, { flex: w1, backgroundColor: colors.violet }]} />
        <View style={[styles.seg, { flex: w2, backgroundColor: colors.amber }]} />
        <View style={[styles.seg, { flex: w3, backgroundColor: colors.jade }]} />
      </View>
      <View style={styles.head}>
        <Text style={styles.headLabel}>AI Compatibility Score</Text>
        <Text style={styles.headVal}>Very High</Text>
      </View>
      <View style={styles.row}>
        <Legend dot={colors.violet} label="Skill" styles={styles} />
        <Legend dot={colors.amber} label="Price" styles={styles} />
        <Legend dot={colors.jade} label="Speed" styles={styles} />
      </View>
    </View>
  );
}

function scoreStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: { marginTop: 10 },
    head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    headLabel: { color: colors.text2, fontSize: 12, fontFamily: fonts.body },
    headVal: { color: colors.primaryText, fontSize: 12, fontWeight: '600', fontFamily: fonts.body },
    bar: {
      flexDirection: 'row',
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      marginBottom: 8,
    },
    seg: { height: '100%' },
    row: { flexDirection: 'row', gap: 16 },
    legend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    label: {
      color: colors.text3,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontFamily: fonts.body,
    },
  });
}
