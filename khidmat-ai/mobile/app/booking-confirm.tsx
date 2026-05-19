import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { AppColors } from '../constants/theme';
import { fonts, radius, shadows, spacing } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';
import ThemedSafeArea from '../components/ThemedSafeArea';
import { useBookingStore } from '../lib/store';
import { getSession } from '../lib/auth';
import { postReview } from '../api/client';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import StitchAppHeader from '../components/stitch/StitchAppHeader';
import InputField from '../components/ui/InputField';
import ReviewTagPicker from '../components/ReviewTagPicker';
import TransparentPricing from '../components/TransparentPricing';
import { showToast } from '../lib/toastStore';
import { useI18n } from '../lib/i18n';

if (Platform.OS !== 'web') {
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export default function BookingConfirmScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => confirmStyles(colors), [colors]);
  const { result } = useBookingStore();
  const { t } = useI18n();
  const scale = useRef(new Animated.Value(0)).current;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewDone, setReviewDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (!result) {
      router.replace('/');
      return;
    }
    const paid =
      result.booking?.payment_status === 'paid' ||
      result.payment?.status === 'paid' ||
      result.booking?.status === 'CONFIRMED';
    if (!result.booking?.booking_id) {
      router.replace('/results');
      return;
    }
    if (!paid) {
      router.replace('/payment');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [result]);

  if (!result?.booking?.booking_id) return null;
  const paid =
    result.booking.payment_status === 'paid' ||
    result.payment?.status === 'paid' ||
    result.booking.status === 'CONFIRMED';
  if (!paid) return null;

  const b = result.booking;
  const code = b.booking_id?.startsWith('KHI')
    ? b.booking_id
    : `KHI-${(b.booking_id || '000000').slice(-6).toUpperCase()}`;

  const setReminder = async () => {
    if (Platform.OS === 'web') {
      showToast('🔔 Reminder set (demo on web)');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    const Notifications = require('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'KhidmatAI reminder',
        body: `Your ${result.intent.service_label} with ${b.provider_name} is in 1 hour`,
      },
      trigger: { seconds: 3600 },
    });
    showToast('🔔 Reminder set for 1 hour before');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const submitReview = async () => {
    if (submitting || reviewDone) return;
    setSubmitting(true);
    try {
      const session = await getSession();
      if (!session) return;
      await postReview({
        booking_id: b.booking_id,
        user_id: session.userId,
        provider_id: result.recommended.id,
        rating,
        comment: comment.trim() || undefined,
        tags: tags.length ? tags : undefined,
        location_area: result.intent.location,
      });
      setReviewDone(true);
      showToast('⭐ Shukriya! Review saved');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedSafeArea edges={['top', 'bottom']}>
      <StitchAppHeader onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.confirmTitle}>{t('confirm_title')}</Text>
        <Text style={styles.bookingRef}>
          Booking ID: <Text style={styles.code}>{code}</Text>
        </Text>

        <View style={styles.quickGrid}>
          <Pressable style={styles.quickBtn} onPress={setReminder}>
            <Text style={styles.quickIcon}>🔔</Text>
            <Text style={styles.quickLabel}>{t('set_reminder')}</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/(tabs)/trace')}>
            <Text style={styles.quickIcon}>🎯</Text>
            <Text style={styles.quickLabel}>{t('view_trace')}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 {t('location')}</Text>
            <Text style={styles.detailVal}>{result.intent.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏰ {t('time')}</Text>
            <Text style={styles.detailVal}>{b.slot}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>💰 {t('service')}</Text>
            <Text style={[styles.detailVal, { color: colors.jade, fontWeight: '700' }]}>
              {result.intent.service_label}
            </Text>
          </View>
        </View>

        {result.pricing ? <TransparentPricing pricing={result.pricing} /> : null}

        <View style={styles.card}>
          <Text style={styles.reviewTitle}>Experience</Text>
          <Text style={styles.reviewSub}>How was your booking experience with us?</Text>
          <ReviewTagPicker selected={tags} onChange={setTags} />
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} disabled={reviewDone}>
                <Text style={[styles.starPick, n <= rating && styles.starOn]}>
                  {n <= rating ? '★' : '☆'}
                </Text>
              </Pressable>
            ))}
          </View>
          <InputField
            icon="💬"
            placeholder="Bahut acha kaam kiya…"
            value={comment}
            onChangeText={setComment}
            multiline
            editable={!reviewDone}
          />
          <Button
            label={reviewDone ? '⭐ Review submitted!' : 'Submit Review'}
            variant="accent"
            onPress={submitReview}
            loading={submitting}
            disabled={reviewDone}
            style={{ width: '100%' }}
          />
        </View>

        <Button
          label={`← ${t('back_home')}`}
          variant="outline"
          onPress={() => router.replace('/')}
          style={{ width: '100%', marginTop: spacing.md }}
        />
      </ScrollView>
    </ThemedSafeArea>
  );
}

function confirmStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  confirmTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  bookingRef: { fontSize: 15, color: colors.text2, marginBottom: spacing.lg, fontFamily: fonts.body },
  quickGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 8,
  },
  quickIcon: { fontSize: 24 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center', fontFamily: fonts.body },
  code: { color: colors.primaryText, fontWeight: '700', fontFamily: fonts.display },
  card: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadows.card,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: 13, color: colors.text2, fontFamily: fonts.body },
  detailVal: { fontSize: 13, fontWeight: '500', color: colors.text, fontFamily: fonts.body },
  reviewTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6, fontFamily: fonts.display },
  reviewSub: { fontSize: 13, color: colors.text2, marginBottom: spacing.md, fontFamily: fonts.body },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  starPick: { fontSize: 30, color: colors.text3 },
  starOn: { color: colors.amber },
  });
}
