import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useI18n } from '../lib/i18n';
import type { Lang } from '../constants/i18n';

const OPTIONS: { key: Lang; label: string; sub: string }[] = [
  { key: 'en', label: 'English', sub: 'EN' },
  { key: 'ur', label: 'اردو', sub: 'UR' },
];

export default function LanguagePicker({
  compact,
  onSelected,
}: {
  compact?: boolean;
  onSelected?: (lang: Lang) => void;
}) {
  const { lang, setLang, t } = useI18n();

  const pick = async (l: Lang) => {
    if (l === lang) return;
    await setLang(l);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelected?.(l);
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {!compact ? <Text style={styles.title}>{t('choose_language')}</Text> : null}
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = lang === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => pick(opt.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
              {!compact ? <Text style={[styles.sub, active && styles.subActive]}>{opt.sub}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  wrapCompact: { marginBottom: spacing.sm },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.text3,
    marginBottom: 8,
    fontFamily: fonts.body,
  },
  row: { flexDirection: 'row', gap: 10 },
  option: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  optionActive: {
    borderColor: colors.violet,
    backgroundColor: colors.violetSoft,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text2,
    fontFamily: fonts.body,
  },
  labelActive: { color: colors.violetBright },
  sub: { fontSize: 10, color: colors.text3, marginTop: 2, fontFamily: fonts.body },
  subActive: { color: colors.text2 },
});
