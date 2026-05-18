import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

const STEPS = ['Request', 'Match', 'Book'] as const;

export default function StepProgress({ active = 1 }: { active?: 0 | 1 | 2 }) {
  return (
    <View style={styles.wrap}>
      {STEPS.map((label, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <View key={label} style={styles.step}>
            <View
              style={[
                styles.dot,
                done && styles.dotDone,
                current && styles.dotCurrent,
              ]}
            />
            <Text style={[styles.label, current && styles.labelCurrent]}>{label}</Text>
            {i < STEPS.length - 1 ? <View style={[styles.line, done && styles.lineDone]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  step: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  dotDone: { backgroundColor: colors.success },
  dotCurrent: { backgroundColor: colors.primary, width: 12, height: 12, borderRadius: 6 },
  label: { color: colors.muted, fontSize: 11, marginLeft: 4, fontWeight: '600' },
  labelCurrent: { color: colors.primary },
  line: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 4 },
  lineDone: { backgroundColor: colors.success },
});
