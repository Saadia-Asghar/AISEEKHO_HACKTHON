import { Pressable, StyleSheet, Text, ViewStyle, ActivityIndicator } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

type Variant = 'violet' | 'jade' | 'outline' | 'ghost';

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
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={[styles.text, variant === 'outline' && styles.textOutline, variant === 'ghost' && styles.textGhost]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.r,
    minHeight: 48,
  },
  violet: { backgroundColor: colors.violet },
  jade: { backgroundColor: colors.jade },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border2,
  },
  ghost: {
    backgroundColor: colors.violetSoft,
    borderWidth: 1,
    borderColor: 'rgba(123,94,167,0.25)',
  },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.97 }] },
  text: { color: colors.text, fontWeight: '600', fontSize: 15, fontFamily: fonts.body },
  textOutline: { color: colors.text },
  textGhost: { color: colors.violetBright },
});
