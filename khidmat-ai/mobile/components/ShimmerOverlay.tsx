import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';

export default function ShimmerOverlay({ visible }: { visible: boolean }) {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulse]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.orb, { opacity: pulse }]}>
        <Text style={styles.orbEmoji}>🧠</Text>
      </Animated.View>
      <Text style={styles.title}>AI Agents Working…</Text>
      <Text style={styles.sub}>Analyzing with Google AI</Text>
      <View style={styles.dots}>
        <View style={[styles.dot, { backgroundColor: colors.violet }]} />
        <View style={[styles.dot, { backgroundColor: colors.jade }]} />
        <View style={[styles.dot, { backgroundColor: colors.amber }]} />
      </View>
      <View style={styles.shimmers}>
        <View style={[styles.shim, { height: 60 }]} />
        <View style={[styles.shim, { width: '75%' }]} />
        <View style={[styles.shim, { width: '55%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
    padding: 40,
  },
  orb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  orbEmoji: { fontSize: 30 },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.display,
    marginBottom: 6,
  },
  sub: { color: colors.text2, fontSize: 12, marginBottom: spacing.md, fontFamily: fonts.body },
  dots: { flexDirection: 'row', gap: 6, marginBottom: spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3 },
  shimmers: { width: '100%', gap: 8 },
  shim: {
    height: 14,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 7,
    opacity: 0.8,
  },
});
