import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../constants/theme';

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const hue = (name.charCodeAt(0) * 17) % 360;
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `hsl(${hue}, 45%, 35%)`,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.35 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.text, fontWeight: '800' },
});
