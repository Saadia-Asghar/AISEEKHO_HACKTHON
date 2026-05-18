import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

export default function VoiceWaveform({ active }: { active: boolean }) {
  const bars = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.5)).current, useRef(new Animated.Value(0.4)).current, useRef(new Animated.Value(0.6)).current, useRef(new Animated.Value(0.35)).current];

  useEffect(() => {
    if (!active) return;
    const anims = bars.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 0.9, duration: 300 + i * 50, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.25, duration: 300 + i * 50, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.row}>
      {bars.map((h, i) => (
        <Animated.View key={i} style={[styles.bar, { transform: [{ scaleY: h }] }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 28, marginBottom: spacing.sm },
  bar: { width: 4, height: 24, borderRadius: 2, backgroundColor: colors.accent },
});
