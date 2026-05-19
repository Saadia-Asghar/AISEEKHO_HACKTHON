import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { AppColors } from '../../constants/theme';
import { fonts, gradients, radius, spacing } from '../../constants/theme';
import { useTheme } from '../../lib/ThemeContext';

type Variant = 'violet' | 'gradient' | 'jade' | 'outline' | 'ghost' | 'accent';

export default function Button({
  label,
  onPress,
  variant = 'violet',
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
  const { colors } = useTheme();
  const styles = useMemo(() => buttonStyles(colors), [colors]);

  const isGradient = variant === 'gradient';
  const content = loading ? (
    <ActivityIndicator color={isGradient || variant === 'violet' ? colors.onPrimaryContainer : colors.text} />
  ) : (
    <Text
      style={[
        styles.text,
        (variant === 'violet' || variant === 'gradient' || variant === 'jade') && styles.textOnFill,
        variant === 'outline' && styles.textOutline,
        variant === 'ghost' && styles.textGhost,
        variant === 'accent' && styles.textAccent,
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
          style={[styles.base, styles.gradient]}
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
        variant === 'accent' && styles.accent,
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

function buttonStyles(colors: AppColors) {
  return StyleSheet.create({
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
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border2,
      borderRadius: radius.pill,
    },
    ghost: {
      backgroundColor: colors.violetSoft,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: radius.pill,
    },
    accent: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.accent,
      borderRadius: radius.pill,
    },
    disabled: { opacity: 0.5 },
    pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
    text: { fontWeight: '700', fontSize: 15, fontFamily: fonts.body },
    textOnFill: { color: colors.onPrimaryContainer },
    textOutline: { color: colors.text },
    textGhost: { color: colors.primaryText },
    textAccent: { color: colors.accent },
  });
}
