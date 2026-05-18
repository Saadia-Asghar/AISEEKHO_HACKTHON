import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

const DEMO_PHRASE = 'Mujhe kal subah G-13 mein AC technician chahiye';

export default function VoiceMicButton({ onTranscript, disabled }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      wrap: { alignItems: 'center', marginVertical: 8 },
      btn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: c.card,
        borderWidth: 2,
        borderColor: c.primary,
        alignItems: 'center',
        justifyContent: 'center',
      },
      btnPressed: { backgroundColor: c.primary, transform: [{ scale: 0.96 }] },
      label: { color: c.muted, fontSize: 12, marginTop: 6 },
    })
  );

  const onPress = async () => {
    if (disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTranscript(DEMO_PHRASE);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel="Voice input"
      >
        <Text style={{ fontSize: 24 }}>🎤</Text>
      </Pressable>
      <Text style={styles.label}>Tap to speak (demo)</Text>
    </View>
  );
}
