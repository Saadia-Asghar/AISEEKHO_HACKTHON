import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { AppColors } from '../constants/theme';
import { spacing } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';

export default function VoiceWaveform({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => wfStyles(colors), [colors]);
  const bars = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.4)).current,
    useRef(new Animated.Value(0.6)).current,
    useRef(new Animated.Value(0.35)).current,
  ];

  useEffect(() => {
    if (!active) return;
    const anims = bars.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 0.95, duration: 220 + i * 40, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.2, duration: 220 + i * 40, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [active, bars]);

  if (!active) return null;

  return (
    <View style={styles.row}>
      {bars.map((h, i) => (
        <Animated.View key={i} style={[styles.bar, { transform: [{ scaleY: h }] }]} />
      ))}
    </View>
  );
}

function wfStyles(colors: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      height: 28,
      marginTop: spacing.sm,
    },
    bar: { width: 4, height: 24, borderRadius: 2, backgroundColor: colors.jade },
  });
}
