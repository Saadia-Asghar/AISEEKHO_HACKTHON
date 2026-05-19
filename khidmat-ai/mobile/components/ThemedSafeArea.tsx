import type { ReactNode } from 'react';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../lib/ThemeContext';

export default function ThemedSafeArea({
  children,
  edges,
  style,
}: {
  children: ReactNode;
  edges?: Edge[];
  style?: object;
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg }, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}
