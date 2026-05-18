import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../constants/theme';
import { BOOKING_FLOW } from '../constants/guide';

export default function StepProgress({ active = 0 }: { active?: 0 | 1 | 2 }) {
  return (
    <View style={styles.wrap}>
      {BOOKING_FLOW.map((item, i) => {
        const done = i < active;
        const current = i === active;
        const isLast = i === BOOKING_FLOW.length - 1;
        return (
          <View key={item.step} style={styles.segment}>
            <View style={styles.col}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  current && styles.dotCurrent,
                ]}
              >
                {done ? <Text style={styles.check}>✓</Text> : (
                  <Text style={[styles.num, current && styles.numCurrent]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.label, current && styles.labelCurrent]}>{item.step}</Text>
            </View>
            {!isLast ? <View style={[styles.line, i < active && styles.lineDone]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  segment: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  col: { alignItems: 'center', minWidth: 56 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.card2,
    borderWidth: 2,
    borderColor: colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.jade, borderColor: colors.jade },
  dotCurrent: { backgroundColor: colors.violet, borderColor: colors.violetBright },
  check: { color: '#fff', fontSize: 12, fontWeight: '800' },
  num: { color: colors.text3, fontSize: 11, fontWeight: '700' },
  numCurrent: { color: '#fff' },
  label: {
    color: colors.text3,
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  labelCurrent: { color: colors.violetBright },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: 11,
    marginHorizontal: 2,
  },
  lineDone: { backgroundColor: colors.jade },
});
