import StepProgress from './StepProgress';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';
import { BOOKING_FLOW } from '../constants/guide';

export default function BookingFlowBar({ step }: { step: 0 | 1 | 2 | 3 }) {
  const current = BOOKING_FLOW[step];
  return (
    <View style={styles.wrap}>
      <StepProgress active={step} />
      <Text style={styles.hint}>{current.hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'transparent',
  },
  hint: {
    fontSize: 12,
    color: colors.text3,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: fonts.body,
  },
});
