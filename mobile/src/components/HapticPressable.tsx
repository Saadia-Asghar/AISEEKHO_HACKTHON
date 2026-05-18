import { Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

type Props = PressableProps & { haptic?: 'light' | 'medium' | 'success' };

export default function HapticPressable({ onPress, haptic = 'light', disabled, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPress={async (e) => {
        if (disabled) return;
        if (haptic === 'success') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          await Haptics.impactAsync(
            haptic === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
          );
        }
        onPress?.(e);
      }}
    />
  );
}
