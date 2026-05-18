import { StyleSheet, Text, View } from 'react-native';
import { LOGO_PURPLE } from '../constants/theme';

type Props = { size?: number };

export default function HazirLogo({ size = 64 }: Props) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.letter, { fontSize: size * 0.45 }]}>H</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: LOGO_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: LOGO_PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 8,
  },
  letter: { color: '#FFFFFF', fontWeight: '800' },
});
