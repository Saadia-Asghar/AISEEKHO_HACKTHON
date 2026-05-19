import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import PaymentCredentialsSheet from '../components/PaymentCredentialsSheet';
import type { PaymentCredentialsPayload } from '../lib/paymentCredentials';
import { router } from 'expo-router';
import type { AppColors } from '../constants/theme';
import { fonts, radius, spacing } from '../constants/theme';
import ThemedSafeArea from '../components/ThemedSafeArea';
import { useTheme } from '../lib/ThemeContext';
import { useBookingStore } from '../lib/store';
import { completeCheckout, getSelectedProvider } from '../lib/bookingFlow';
import type { PaymentMethod } from '../api/client';
import Button from '../components/ui/Button';
import StitchAppHeader from '../components/stitch/StitchAppHeader';
import StitchGlassCard from '../components/stitch/StitchGlassCard';
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
  const { colors } = useTheme();
  const styles = useMemo(() => paymentStyles(colors), [colors]);
  const { result } = useBookingStore();
  const { t } = useI18n();
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [paying, setPaying] = useState(false);
  const [credSheet, setCredSheet] = useState(false);

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
      <ThemedSafeArea>
        <ActivityIndicator color={colors.violet} style={{ marginTop: spacing.xl }} />
      </ThemedSafeArea>
    );
  }

  const estimateMin = result.pricing?.estimate_min_pkr;
  const estimateMax = result.pricing?.estimate_max_pkr;
  const estimate =
    estimateMin && estimateMax
      ? `PKR ${estimateMin.toLocaleString()}–${estimateMax.toLocaleString()}`
      : 'Quote on visit';

  const onPayPress = () => {
    if (paying) return;
    setCredSheet(true);
  };

  const onCredentialsSubmit = async (credentials: PaymentCredentialsPayload) => {
    if (paying) return;
    setPaying(true);
    try {
      const ok = await completeCheckout(method, credentials, { navigate: false });
      if (!ok) return;
      setCredSheet(false);
      showToast(t('payment_success'));
      setTimeout(() => router.replace('/booking-confirm'), 800);
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('payment_failed'));
    } finally {
      setPaying(false);
    }
  };

  return (
    <ThemedSafeArea edges={['top', 'bottom']}>
      <StitchAppHeader onBack={() => router.back()} />
      <View style={styles.head}>
        <Text style={styles.headTitle}>{t('payment_title')}</Text>
        <Text style={styles.headSub}>
          {result.intent.service_label} · {result.intent.location}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <StitchGlassCard style={styles.orderCard}>
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
          </StitchGlassCard>

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
            onPress={onPayPress}
            loading={paying}
            style={{ width: '100%', marginTop: spacing.md }}
          />
          <PaymentCredentialsSheet
            visible={credSheet}
            method={method}
            amountLabel={estimate}
            onClose={() => setCredSheet(false)}
            onSubmit={onCredentialsSubmit}
            processing={paying}
          />
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backText}>← {t('change_provider')}</Text>
          </Pressable>
          <Text style={styles.footer}>{t('payment_notify_hint')}</Text>
      </ScrollView>
    </ThemedSafeArea>
  );
}

function paymentStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  headTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: '600',
    color: colors.primaryText,
  },
  headSub: { fontSize: 14, color: colors.text2, marginTop: 6, fontFamily: fonts.body },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  orderCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
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
}
