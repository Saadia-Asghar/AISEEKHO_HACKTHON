import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AppColors } from '../constants/theme';
import { fonts, radius } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

type Variant = 'violet' | 'teal' | 'amber';

function variantFor(name: string): Variant {
  const n = name.charCodeAt(0) % 3;
  return n === 0 ? 'violet' : n === 1 ? 'teal' : 'amber';
}

export default function Avatar({
  name,
  size = 48,
  variant,
  square,
}: {
  name: string;
  size?: number;
  variant?: Variant;
  square?: boolean;
}) {
  const { colors } = useTheme();
  const variantBg = useMemo(
    (): Record<Variant, string> => ({
      violet: colors.violet,
      teal: colors.jade,
      amber: colors.amber,
    }),
    [colors]
  );
  const styles = useMemo(() => avatarStyles(colors), [colors]);
  const v = variant ?? variantFor(name);
  const br = square ? radius.md : size / 2;
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: br,
          backgroundColor: variantBg[v],
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.32 }]}>{initials(name)}</Text>
    </View>
  );
}

function avatarStyles(colors: AppColors) {
  return StyleSheet.create({
    circle: { alignItems: 'center', justifyContent: 'center' },
    text: { color: colors.onPrimaryContainer, fontWeight: '700', fontFamily: fonts.display },
  });
}
