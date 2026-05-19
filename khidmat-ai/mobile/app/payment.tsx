import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, radius, shadows, spacing } from '../constants/theme';
import { useBookingStore } from '../lib/store';
import { completeCheckout, getSelectedProvider } from '../lib/bookingFlow';
import type { PaymentMethod } from '../api/client';
import Button from '../components/ui/Button';
import CurvedSheet from '../components/ui/CurvedSheet';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import TransparentPricing from '../components/TransparentPricing';
import { showToast } from '../lib/toastStore';
import { useI18n } from '../lib/i18n';

const METHODS: { id: PaymentMethod; labelKey: string; icon: string }[] = [
  { id: 'card', labelKey: 'pay_card', icon: '💳' },
  { id: 'jazzcash', labelKey: 'pay_jazzcash', icon: '📱' },
  { id: 'easypaisa', labelKey: 'pay_easypaisa', icon: '💚' },
  { id: 'cash', labelKey: 'pay_cash', icon: '💵' },
];

export default function PaymentScreen() {
  const { result } = useBookingStore();
  const { t } = useI18n();
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [paying, setPaying] = useState(false);

  const provider = getSelectedProvider();

  useEffect(() => {
    if (!result?.session_id) {
      router.replace('/');
      return;
    }
    if (!provider) {
      router.replace('/results');
    }
  }, [result?.session_id, provider?.id]);

  if (!result || !provider) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.violet} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  const estimateMin = result.pricing?.estimate_min_pkr;
  const estimateMax = result.pricing?.estimate_max_pkr;
  const estimate =
    estimateMin && estimateMax
      ? `PKR ${estimateMin.toLocaleString()}–${estimateMax.toLocaleString()}`
      : 'Quote on visit';

  const onPay = async () => {
    if (paying) return;
    setPaying(true);
    try {
      await completeCheckout(method);
      showToast(t('payment_success'));
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('payment_failed'));
    } finally {
      setPaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <PageHeader
        title={t('payment_title')}
        subtitle={`${result.intent.service_label} · ${result.intent.location}`}
        onBack={() => router.back()}
      />
      <CurvedSheet style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.orderCard}>
            <Text style={styles.orderLabel}>{t('order_summary')}</Text>
            <View style={styles.orderRow}>
              <Avatar name={provider.name} size={52} square />
              <View style={{ flex: 1 }}>
                <Text style={styles.orderName}>{provider.name}</Text>
                <Text style={styles.orderMeta}>
                  ★ {provider.rating.toFixed(1)} · {provider.distance_km.toFixed(1)} km
                </Text>
                <Text style={styles.orderSlot}>{result.intent.time_expression || 'Flexible'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>{t('payment_amount')}</Text>
              <Text style={styles.lineVal}>{estimate}</Text>
            </View>
          </View>

          <TransparentPricing pricing={result.pricing} />

          <Text style={styles.sec}>{t('payment_method')}</Text>
          {METHODS.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.methodRow, method === m.id && styles.methodOn]}
              onPress={() => setMethod(m.id)}
            >
              <Text style={styles.methodIcon}>{m.icon}</Text>
              <Text style={styles.methodLabel}>{t(m.labelKey)}</Text>
              {method === m.id ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
          ))}

          <Button
            label={t('payment_confirm')}
            onPress={onPay}
            loading={paying}
            style={{ width: '100%', marginTop: spacing.md }}
          />
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backText}>← {t('change_provider')}</Text>
          </Pressable>
          <Text style={styles.footer}>{t('payment_notify_hint')}</Text>
        </ScrollView>
      </CurvedSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  sheet: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  orderLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.text3,
    marginBottom: spacing.md,
    fontFamily: fonts.body,
  },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  orderName: { fontSize: 16, fontWeight: '600', color: colors.text, fontFamily: fonts.body },
  orderMeta: { fontSize: 12, color: colors.text2, marginTop: 4, fontFamily: fonts.body },
  orderSlot: { fontSize: 11, color: colors.violetBright, marginTop: 4, fontFamily: fonts.body },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineLabel: { fontSize: 13, color: colors.text2, fontFamily: fonts.body },
  lineVal: { fontSize: 15, fontWeight: '700', color: colors.jade, fontFamily: fonts.body },
  sec: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text3,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: fonts.body,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  methodOn: { borderColor: colors.violet, backgroundColor: colors.violetSoft },
  methodIcon: { fontSize: 22 },
  methodLabel: { flex: 1, fontSize: 15, color: colors.text, fontFamily: fonts.body },
  check: { color: colors.violetBright, fontWeight: '700', fontSize: 16 },
  backLink: { alignItems: 'center', paddingVertical: spacing.md },
  backText: { color: colors.text2, fontSize: 13, fontWeight: '600', fontFamily: fonts.body },
  footer: {
    fontSize: 11,
    color: colors.text3,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: fonts.body,
  },
});
