import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../constants/theme';

type Props = {
  distance: number;
  rating: number;
  availability: number;
};

export default function ScoreBar({ distance, rating, availability }: Props) {
  const total = Math.max(distance + rating + availability, 0.01);
  const w1 = (distance / total) * 100;
  const w2 = (rating / total) * 100;
  const w3 = (availability / total) * 100;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>40% dist</Text>
        <Text style={styles.label}>35% rating</Text>
        <Text style={styles.label}>25% avail</Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.seg, { flex: w1, backgroundColor: colors.primary }]} />
        <View style={[styles.seg, { flex: w2, backgroundColor: colors.accent }]} />
        <View style={[styles.seg, { flex: w3, backgroundColor: colors.success }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: colors.muted, fontSize: 10 },
  bar: { flexDirection: 'row', height: 8, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.border },
  seg: { height: '100%' },
});
