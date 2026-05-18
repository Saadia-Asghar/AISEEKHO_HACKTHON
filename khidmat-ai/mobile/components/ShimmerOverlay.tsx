import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

export default function ShimmerOverlay({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.Text style={[styles.text, { opacity }]}>AI agents working…</Animated.Text>
      <View style={styles.bar} />
      <View style={[styles.bar, { width: '70%' }]} />
      <View style={[styles.bar, { width: '85%' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg + 'EE',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: spacing.lg,
  },
  text: { color: colors.primary, fontSize: 18, fontWeight: '700', marginBottom: spacing.lg },
  bar: {
    height: 14,
    width: '90%',
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 10,
  },
});
