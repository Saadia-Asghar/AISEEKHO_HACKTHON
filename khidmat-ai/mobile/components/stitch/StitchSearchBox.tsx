import { type ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AppColors } from '../../constants/theme';
import { fonts, radius, spacing } from '../../constants/theme';
import { useTheme } from '../../lib/ThemeContext';

export default function StitchSearchBox({
  value,
  onChangeText,
  placeholder,
  onFocus,
  onBlur,
  editable = true,
  footer,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  footer?: ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => boxStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        multiline
        textAlignVertical="top"
        editable={editable}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

export function StitchSearchActions({
  onDemo,
  onBook,
  demoLabel,
  bookLabel,
  loading,
}: {
  onDemo: () => void;
  onBook: () => void;
  demoLabel: string;
  bookLabel: string;
  loading?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => boxStyles(colors), [colors]);

  return (
    <>
      <Pressable style={styles.demoBtn} onPress={onDemo} disabled={loading}>
        <Text style={styles.demoText}>{demoLabel}</Text>
      </Pressable>
      <Pressable style={[styles.bookBtn, loading && styles.bookDisabled]} onPress={onBook} disabled={loading}>
        <Text style={styles.bookText}>{bookLabel}</Text>
      </Pressable>
    </>
  );
}

function boxStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.bgLowest,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: radius.lg,
      minHeight: 120,
      marginBottom: spacing.md,
    },
    input: {
      padding: spacing.md,
      paddingBottom: 52,
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      fontFamily: fonts.body,
      minHeight: 100,
    },
    footer: {
      position: 'absolute',
      right: spacing.sm,
      bottom: spacing.sm,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    demoBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    demoText: { color: colors.accent, fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
    bookBtn: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.violet,
    },
    bookDisabled: { opacity: 0.6 },
    bookText: { color: colors.onPrimaryContainer, fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
  });
}
