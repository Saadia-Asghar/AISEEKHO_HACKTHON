import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadows, spacing } from '../constants/theme';
import Button from './ui/Button';
import Avatar from './Avatar';
import { useI18n } from '../lib/i18n';

type Props = {
  providerName: string;
  subtitle?: string;
  estimateLabel?: string;
  onContinue: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function CheckoutBar({
  providerName,
  subtitle,
  estimateLabel,
  onContinue,
  loading,
  disabled,
}: Props) {
  const { t } = useI18n();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Avatar name={providerName} size={44} square />
        <View style={styles.info}>
          <Text style={styles.label}>{t('your_pick')}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {providerName}
          </Text>
          {subtitle ? (
            <Text style={styles.sub} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {estimateLabel ? <Text style={styles.estimate}>{estimateLabel}</Text> : null}
      </View>
      <Button
        label={t('continue_payment')}
        onPress={onContinue}
        loading={loading}
        disabled={disabled}
        style={{ width: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border2,
    gap: spacing.sm,
    ...shadows.soft,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.violetBright,
    fontFamily: fonts.body,
  },
  name: { fontSize: 15, fontWeight: '600', color: colors.text, fontFamily: fonts.body },
  sub: { fontSize: 11, color: colors.text2, marginTop: 2, fontFamily: fonts.body },
  estimate: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.jade,
    fontFamily: fonts.body,
  },
});
