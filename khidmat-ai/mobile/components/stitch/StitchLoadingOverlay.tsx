import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '../../constants/theme';
import { fonts, radius, spacing } from '../../constants/theme';
import { useTheme } from '../../lib/ThemeContext';

const MESSAGES = [
  'AI agents are finding your perfect match...',
  'Connecting you with top pros...',
  'Analyzing service history...',
  'Securing the best rates for you...',
  'Finalizing agent connection...',
];

/** Full-screen loading — matches `loading_state/code.html` */
export default function StitchLoadingOverlay({
  visible,
  subtitle = 'Scanning 1,400+ verified professionals',
}: {
  visible: boolean;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => overlayStyles(colors), [colors]);
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setProgress(0);
    setMessageIndex(0);
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2000, useNativeDriver: true })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
      spin.setValue(0);
    };
  }, [visible, spin, pulse]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setProgress((p) => {
        const next = Math.min(100, p + Math.random() * 8);
        const nextIdx = Math.min(MESSAGES.length - 1, Math.floor(next / 20));
        setMessageIndex((idx) => {
          if (nextIdx > idx) {
            Animated.sequence([
              Animated.timing(textOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
              Animated.timing(textOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]).start();
            return nextIdx;
          }
          return idx;
        });
        if (next < 100) setTimeout(tick, 400 + Math.random() * 600);
        return next;
      });
    };
    const t = setTimeout(tick, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [visible, textOpacity]);

  if (!visible) return null;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.overlay}>
      <View style={styles.mesh} />
      <View style={styles.center}>
        <Animated.View style={[styles.glow, { transform: [{ scale: pulse }] }]} />
        <Animated.View style={[styles.ring, { transform: [{ rotate }] }]} />
        <View style={styles.micOrb}>
          <Text style={styles.micIcon}>🎤</Text>
        </View>
      </View>

      <View style={styles.copy}>
        <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
          {MESSAGES[messageIndex]}
        </Animated.Text>
        <Text style={styles.sub}>{subtitle}</Text>
        <View style={styles.track}>
          <View style={[styles.bar, { width: `${progress}%` }]} />
        </View>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusLabel}>Optimizing results</Text>
        </View>
      </View>

      <Text style={styles.footer}>Powered by Google</Text>
    </View>
  );
}

function overlayStyles(colors: AppColors) {
  return StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    paddingHorizontal: spacing.lg,
  },
  mesh: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // RN: approximate radial mesh via centered wash
    opacity: 1,
  },
  center: {
    width: 192,
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  ring: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    borderWidth: 3,
    borderColor: colors.violetBright,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  micOrb: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  micIcon: { fontSize: 52 },
  copy: {
    marginTop: spacing.xl,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 24,
  },
  track: {
    width: '100%',
    height: 6,
    backgroundColor: colors.card2,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  bar: {
    height: '100%',
    backgroundColor: colors.violet,
    borderRadius: radius.pill,
    minWidth: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.jade,
  },
  statusLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.jade,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    fontSize: 12,
    color: colors.text3,
    fontFamily: fonts.body,
  },
  });
}
