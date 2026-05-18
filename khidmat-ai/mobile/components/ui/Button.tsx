import { Pressable, StyleSheet, Text, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, gradients, radius, shadows, spacing } from '../../constants/theme';

type Variant = 'violet' | 'gradient' | 'jade' | 'outline' | 'ghost';

export default function Button({
  label,
  onPress,
  variant = 'gradient',
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const isGradient = variant === 'gradient' || variant === 'violet';
  const content = loading ? (
    <ActivityIndicator color={colors.text} />
  ) : (
    <Text
      style={[
        styles.text,
        variant === 'outline' && styles.textOutline,
        variant === 'ghost' && styles.textGhost,
      ]}
    >
      {label}
    </Text>
  );

  if (isGradient && !disabled && !loading) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [pressed && styles.pressed, style]}
      >
        <LinearGradient
          colors={[...gradients.hero]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, styles.gradient, shadows.soft]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'jade' && styles.jade,
        variant === 'violet' && styles.violet,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    minHeight: 52,
  },
  gradient: {},
  violet: { backgroundColor: colors.violet },
  jade: { backgroundColor: colors.jade, borderRadius: radius.pill },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border2,
    borderRadius: radius.pill,
  },
  ghost: {
    backgroundColor: colors.violetSoft,
    borderWidth: 1,
    borderColor: 'rgba(123,94,167,0.25)',
    borderRadius: radius.pill,
  },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  text: { color: colors.text, fontWeight: '700', fontSize: 15, fontFamily: fonts.body },
  textOutline: { color: colors.text },
  textGhost: { color: colors.violetBright },
});
