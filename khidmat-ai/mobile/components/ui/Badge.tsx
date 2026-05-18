import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../constants/theme';

type Variant = 'violet' | 'jade' | 'amber' | 'gray' | 'rose';

export default function Badge({ label, variant = 'violet' }: { label: string; variant?: Variant }) {
  return (
    <View style={[styles.base, styles[variant]]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  violet: { backgroundColor: colors.violetSoft, borderColor: 'rgba(123,94,167,0.25)' },
  jade: { backgroundColor: colors.jadeSoft, borderColor: 'rgba(46,196,169,0.25)' },
  amber: { backgroundColor: colors.amberSoft, borderColor: 'rgba(232,168,56,0.25)' },
  gray: { backgroundColor: 'rgba(160,155,192,0.1)', borderColor: colors.border },
  rose: { backgroundColor: colors.roseSoft, borderColor: 'rgba(232,93,122,0.25)' },
  text: { fontSize: 11, fontWeight: '600', fontFamily: fonts.body },
  text_violet: { color: colors.violetBright },
  text_jade: { color: colors.jade },
  text_amber: { color: colors.amber },
  text_gray: { color: colors.text2 },
  text_rose: { color: colors.rose },
});
