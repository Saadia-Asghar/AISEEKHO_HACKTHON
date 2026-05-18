import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import HapticPressable from './HapticPressable';
import { useTheme } from '../hooks/useTheme';

type Props = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: 'en' | 'ur';
};

const DEMO_EN = 'I need an AC technician in G-13 tomorrow morning';
const DEMO_UR = 'Mujhe kal subah G-13 mein AC technician chahiye';

export default function MicButton({ onTranscript, disabled, language = 'ur' }: Props) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: colors.primary,
            transform: [{ scale: pulse }],
            opacity: pulse.interpolate({ inputRange: [1, 1.12], outputRange: [0.35, 0.7] }),
          },
        ]}
      />
      <HapticPressable
        haptic="medium"
        disabled={disabled}
        style={[
          styles.btn,
          {
            backgroundColor: colors.card,
            borderColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        onPress={() => onTranscript(language === 'en' ? DEMO_EN : DEMO_UR)}
      >
        <Text style={styles.icon}>🎤</Text>
      </HapticPressable>
      <Text style={[styles.label, { color: colors.muted }]}>
        {language === 'en' ? 'Tap to speak' : 'بولیں — Tap to speak'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 12 },
  ring: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    top: 0,
  },
  btn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  icon: { fontSize: 28 },
  label: { fontSize: 12, marginTop: 10 },
});
