import { useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AppColors } from '../constants/theme';
import { fonts, radius, spacing } from '../constants/theme';

const BOXES = 4;

/** Four boxes — avoids Chrome classifying a single field as credit-card on HTTP. */
export default function CardDigitInput({
  value,
  onChange,
  colors,
  label,
}: {
  value: string;
  onChange: (digits: string) => void;
  colors: AppColors;
  label: string;
}) {
  const styles = useMemo(() => digitStyles(colors), [colors]);
  const refs = useRef<(TextInput | null)[]>([]);
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const chunks = Array.from({ length: BOXES }, (_, i) => digits.slice(i * 4, i * 4 + 4));

  const setChunk = (index: number, text: string) => {
    const part = text.replace(/\D/g, '').slice(0, 4);
    const next = [...chunks];
    next[index] = part;
    const joined = next.join('').slice(0, 16);
    onChange(joined);
    if (part.length === 4 && index < BOXES - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const webNoCc = Platform.OS === 'web'
    ? ({
        autoComplete: 'new-password' as const,
        name: 'khidmat_account_ref',
        type: 'text' as const,
        inputMode: 'numeric' as const,
        // @ts-expect-error web
        dataSet: { '1p-ignore': 'true', lpignore: 'true', formType: 'other' },
      } as const)
    : { autoComplete: 'off' as const, textContentType: 'none' as const };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {chunks.map((chunk, i) => (
          <TextInput
            key={i}
            ref={(r) => {
              refs.current[i] = r;
            }}
            style={styles.box}
            value={chunk}
            onChangeText={(t) => setChunk(i, t)}
            placeholder="••••"
            placeholderTextColor={colors.text3}
            keyboardType="number-pad"
            maxLength={4}
            importantForAutofill="no"
            autoCorrect={false}
            spellCheck={false}
            {...webNoCc}
          />
        ))}
      </View>
    </View>
  );
}

function digitStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.md },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text2,
      marginBottom: 6,
      fontFamily: fonts.body,
    },
    row: { flexDirection: 'row', gap: 8 },
    box: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 14,
      paddingHorizontal: 8,
      fontSize: 18,
      textAlign: 'center',
      color: colors.text,
      fontFamily: fonts.body,
      letterSpacing: 2,
    },
  });
}
