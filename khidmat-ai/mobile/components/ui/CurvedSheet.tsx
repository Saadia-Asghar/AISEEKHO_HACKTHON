import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { sheetCurve } from '../../constants/theme';

/** Stitch flat content panel */
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
  sheet: { ...sheetCurve },
});
