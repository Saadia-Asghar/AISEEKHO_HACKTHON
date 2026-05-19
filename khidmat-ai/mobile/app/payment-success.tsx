import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { AppColors } from '../constants/theme';
import { fonts, radius, spacing } from '../constants/theme';
import ThemedSafeArea from '../components/ThemedSafeArea';
import { useTheme } from '../lib/ThemeContext';
import { useBookingStore } from '../lib/store';
import { getSelectedProvider } from '../lib/bookingFlow';
import Button from '../components/ui/Button';
import StitchAppHeader from '../components/stitch/StitchAppHeader';
import { HeaderActions } from '../components/NotificationBell';
import StitchGlassCard from '../components/stitch/StitchGlassCard';
import { useI18n } from '../lib/i18n';
import { pushInAppNotification } from '../lib/appNotifications';

export default function PaymentSuccessScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => successStyles(colors), [colors]);
  const { result } = useBookingStore();
  const { t } = useI18n();
  const scale = useRef(new Animated.Value(0)).current;
  const storedPaymentNotice = useRef(false);
  const provider = getSelectedProvider();

  useEffect(() => {
    const paid =
      result?.booking?.payment_status === 'paid' ||
      result?.payment?.status === 'paid' ||
      result?.booking?.status === 'CONFIRMED';

    if (!result?.booking?.booking_id) {
      router.replace('/');
      return;
    }
    if (!paid) {
      router.replace('/payment');
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

    if (!storedPaymentNotice.current) {
      storedPaymentNotice.current = true;
      pushInAppNotification(
        t('payment_success'),
        `${result.intent.service_label} · ${result.booking.booking_id}`,
        'payment',
        { toast: false }
      );
    }
  }, [result?.booking?.booking_id, t]);

  if (!result?.booking?.booking_id) {
    return null;
  }

  const b = result.booking;
  const code = b.booking_id?.startsWith('KHI')
    ? b.booking_id
    : `KHI-${(b.booking_id || '000000').slice(-6).toUpperCase()}`;

  return (
    <ThemedSafeArea edges={['top', 'bottom']}>
      <StitchAppHeader right={<HeaderActions />} />
      <View style={styles.body}>
        <Animated.View style={[styles.checkWrap, { transform: [{ scale }] }]}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </Animated.View>

        <Text style={styles.title}>{t('payment_success_title')}</Text>
        <Text style={styles.sub}>{t('payment_success_sub')}</Text>

        <StitchGlassCard style={styles.card}>
          <Text style={styles.refLabel}>{t('booking_ref')}</Text>
          <Text style={styles.refCode}>{code}</Text>
          {provider ? (
            <Text style={styles.meta}>
              {provider.name} · {result.intent.service_label}
            </Text>
          ) : null}
          <Text style={styles.meta}>{result.intent.location} · {b.slot}</Text>
        </StitchGlassCard>

        <Button
          label={t('payment_success_continue')}
          onPress={() => router.replace('/booking-confirm')}
          style={{ width: '100%', marginTop: spacing.lg }}
        />
        <Button
          label={t('view_notifications')}
          variant="outline"
          onPress={() => router.push('/notifications')}
          style={{ width: '100%', marginTop: spacing.sm }}
        />
        <Button
          label={t('back_home')}
          variant="outline"
          onPress={() => router.replace('/')}
          style={{ width: '100%', marginTop: spacing.sm }}
        />
      </View>
    </ThemedSafeArea>
  );
}

function successStyles(colors: AppColors) {
  return StyleSheet.create({
    body: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      alignItems: 'center',
    },
    checkWrap: { marginBottom: spacing.lg },
    checkCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.jade,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.jade,
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 8,
    },
    checkMark: { fontSize: 44, color: '#fff', fontWeight: '700' },
    title: {
      fontFamily: fonts.display,
      fontSize: 26,
      fontWeight: '700',
      color: colors.primaryText,
      textAlign: 'center',
    },
    sub: {
      fontSize: 14,
      color: colors.text2,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: spacing.lg,
      lineHeight: 20,
      fontFamily: fonts.body,
    },
    card: { width: '100%', padding: spacing.lg, alignItems: 'center' },
    refLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: colors.text3,
      textTransform: 'uppercase',
      fontFamily: fonts.body,
    },
    refCode: {
      fontFamily: fonts.display,
      fontSize: 22,
      fontWeight: '700',
      color: colors.jade,
      marginTop: 6,
      marginBottom: spacing.sm,
    },
    meta: {
      fontSize: 13,
      color: colors.text2,
      textAlign: 'center',
      marginTop: 4,
      fontFamily: fonts.body,
    },
  });
}
