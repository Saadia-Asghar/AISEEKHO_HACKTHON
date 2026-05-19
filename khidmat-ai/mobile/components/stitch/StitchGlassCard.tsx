import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useMemo } from 'react';
import { radius } from '../../constants/theme';
import { useTheme } from '../../lib/ThemeContext';

export default function StitchGlassCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const cardStyle = useMemo(
    () => ({
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl,
      overflow: 'hidden' as const,
    }),
    [colors]
  );
  return <View style={[cardStyle, style]}>{children}</View>;
}
