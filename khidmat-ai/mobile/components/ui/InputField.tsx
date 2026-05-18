import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

export default function InputField({
  label,
  icon,
  error,
  containerStyle,
  ...props
}: TextInputProps & {
  label?: string;
  icon?: string;
  error?: string;
  containerStyle?: object;
}) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, error && styles.fieldError]}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <TextInput
          placeholderTextColor={colors.text3}
          style={[styles.input, props.multiline && styles.multiline]}
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text2,
    marginBottom: 8,
    fontFamily: fonts.body,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  fieldError: { borderColor: colors.rose },
  icon: { fontSize: 18, marginRight: 10 },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 14,
    fontFamily: fonts.body,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  error: { color: colors.rose, fontSize: 11, marginTop: 6, fontFamily: fonts.body },
});
