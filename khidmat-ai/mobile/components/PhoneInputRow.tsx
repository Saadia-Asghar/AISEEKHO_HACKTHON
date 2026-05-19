import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  editable?: boolean;
  placeholder?: string;
};

/** Stitch-style 🇵🇰 +92 + phone in one card row */
export default function PhoneInputRow({
  value,
  onChangeText,
  editable = true,
  placeholder = '3XX XXXXXXX',
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.prefix}>
        <Text style={styles.flag}>🇵🇰</Text>
        <Text style={styles.code}>+92</Text>
      </View>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        maxLength={10}
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/\D/g, '').slice(0, 10))}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    minHeight: 56,
    marginBottom: spacing.md,
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    marginRight: 12,
  },
  flag: { fontSize: 20 },
  code: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: fonts.body },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.body,
    paddingVertical: 14,
  },
});
