import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../constants/theme';

type Props = {
  distance: number;
  rating: number;
  availability: number;
};

export default function ScoreBar({ distance, rating, availability }: Props) {
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
      <View style={styles.row}>
        <Text style={styles.label}>🟣 Skill {(distance * 10).toFixed(1)}</Text>
        <Text style={styles.label}>🟠 Speed {(rating * 10).toFixed(1)}</Text>
        <Text style={styles.label}>🟢 Value {(availability * 10).toFixed(1)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10 },
  bar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 2,
    marginBottom: 7,
  },
  seg: { height: '100%', borderRadius: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.text3, fontSize: 10, fontFamily: fonts.body },
});
