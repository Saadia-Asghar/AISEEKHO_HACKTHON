import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LOGO_TEAL } from '../constants/theme';

type Props = { size?: number; style?: ViewStyle };

export default function SahulLogo({ size = 72, style }: Props) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={[styles.letter, { fontSize: size * 0.48 }]}>S</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: LOGO_TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
