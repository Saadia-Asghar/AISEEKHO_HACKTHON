import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { ONBOARDING_STEPS } from '../constants/guide';
import { markOnboardingSeen } from '../lib/onboarding';
import Button from './ui/Button';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function OnboardingModal({ visible, onClose }: Props) {
  const [step, setStep] = useState(0);
  const { width } = useWindowDimensions();
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  const finish = async () => {
    await markOnboardingSeen();
    setStep(0);
    onClose();
  };

  const next = async () => {
    if (isLast) {
      await finish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const skip = async () => {
    await markOnboardingSeen();
    setStep(0);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={skip}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { maxWidth: Math.min(width - 32, 420) }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetHeaderIcon}>{current.icon}</Text>
          </View>
          <View style={styles.dots}>
            {ONBOARDING_STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotOn]} />
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.body}>{current.body}</Text>
            {current.bullets?.map((b) => (
              <View key={b} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.stepCounter}>
            Step {step + 1} of {ONBOARDING_STEPS.length}
          </Text>

          <View style={styles.actions}>
            <Button
              label={isLast ? "Let's go!" : 'Next →'}
              onPress={next}
              style={{ flex: 1 }}
            />
            <Pressable onPress={skip} style={styles.skipBtn}>
              <Text style={styles.skipText}>{isLast ? 'Close' : 'Skip tour'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.sheet,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border2,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  sheetHeader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.violet,
  },
  sheetHeaderIcon: { fontSize: 44 },
  scroll: { maxHeight: 280, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border2 },
  dotOn: { width: 18, backgroundColor: colors.violet },
  icon: { fontSize: 48, textAlign: 'center', marginBottom: spacing.sm },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 14,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: fonts.body,
    marginBottom: spacing.md,
  },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 8, paddingHorizontal: 4 },
  bulletDot: { color: colors.violetBright, fontSize: 14 },
  bulletText: { flex: 1, color: colors.text2, fontSize: 13, lineHeight: 20, fontFamily: fonts.body },
  stepCounter: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.text3,
    marginTop: spacing.sm,
    fontFamily: fonts.body,
  },
  actions: { marginTop: spacing.md, gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  skipBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  skipText: { color: colors.text3, fontSize: 13, fontFamily: fonts.body },
});
