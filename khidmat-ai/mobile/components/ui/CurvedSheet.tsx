import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, sheetCurve } from '../../constants/theme';

export default function CurvedSheet({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.sheet, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  sheet: {
    ...sheetCurve,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    minHeight: 200,
  },
});
