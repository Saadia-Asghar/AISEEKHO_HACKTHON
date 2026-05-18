import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { gradients } from '../../constants/theme';

export default function GradientView({
  children,
  style,
  colors: colorStops = gradients.hero,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: {
  children?: ReactNode;
  style?: ViewStyle;
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}) {
  return (
    <LinearGradient colors={[...colorStops]} start={start} end={end} style={[styles.fill, style]}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
