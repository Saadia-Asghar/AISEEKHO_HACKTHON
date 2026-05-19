import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '../constants/theme';
import { fonts, radius, spacing } from '../constants/theme';
import { useI18n } from '../lib/i18n';
import { useTheme } from '../lib/ThemeContext';
import type { PricingTransparency } from '../api/client';

export default function TransparentPricing({ pricing }: { pricing?: PricingTransparency }) {
  const { t, lang } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => pricingStyles(colors), [colors]);
  if (!pricing) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('pricing_title')}</Text>
      <Text style={styles.range}>
        PKR {pricing.estimate_min_pkr.toLocaleString()} – {pricing.estimate_max_pkr.toLocaleString()}
      </Text>
      <Text style={styles.note}>{pricing.visit_fee_note || t('pricing_visit')}</Text>
      <Text style={styles.note}>{pricing.final_price_note || t('pricing_final')}</Text>
      <Text style={styles.sub}>{t('typical_jobs')}</Text>
      {pricing.typical_jobs.map((job) => (
        <View key={job.title} style={styles.row}>
          <Text style={styles.jobTitle}>
            {lang === 'ur' && job.title_ur ? job.title_ur : job.title}
          </Text>
          <Text style={styles.jobPrice}>
            {job.price_min_pkr.toLocaleString()}–{job.price_max_pkr.toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
  );
}

function pricingStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: { fontWeight: '700', fontSize: 14, color: colors.text, fontFamily: fonts.body },
    range: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.jade,
      marginVertical: 6,
      fontFamily: fonts.display,
    },
    note: { fontSize: 11, color: colors.text2, lineHeight: 16, fontFamily: fonts.body },
    sub: {
      marginTop: 12,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      color: colors.text3,
      fontFamily: fonts.body,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    jobTitle: { flex: 1, fontSize: 12, color: colors.text2, fontFamily: fonts.body },
    jobPrice: { fontSize: 12, fontWeight: '600', color: colors.text, fontFamily: fonts.body },
  });
}
