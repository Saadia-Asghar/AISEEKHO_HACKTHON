import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, gradients, radius, shadows, spacing } from '../constants/theme';
import { useBookingStore } from '../lib/store';
import { getSession } from '../lib/auth';
import { postReview } from '../api/client';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import BookingFlowBar from '../components/BookingFlowBar';
import CurvedSheet from '../components/ui/CurvedSheet';
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [result]);

  if (!result || !result.booking) return null;

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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient colors={[...gradients.jade]} style={styles.heroGrad}>
        <Animated.View style={[styles.checkAnim, { transform: [{ scale }] }]}>
          <Text style={styles.checkMark}>✓</Text>
        </Animated.View>
        <Text style={styles.confirmTitle}>{t('confirm_title')}</Text>
        <Text style={styles.bookingRef}>
          Code: <Text style={styles.code}>{code}</Text>
        </Text>
        <Badge label={`${b.provider_name} · ${b.slot}`} variant="jade" />
      </LinearGradient>
      <CurvedSheet style={styles.sheet}>
        <BookingFlowBar step={3} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.nextHint}>{t('confirm_next')}</Text>

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
          <Text style={styles.reviewTitle}>{t('rate_experience')}</Text>
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
            variant="jade"
            onPress={submitReview}
            loading={submitting}
            disabled={reviewDone}
            style={{ width: '100%' }}
          />
        </View>

        <Button label={`🔔 ${t('set_reminder')}`} variant="outline" onPress={setReminder} style={{ width: '100%' }} />
        <Button
          label={`🧠 ${t('view_trace')}`}
          variant="outline"
          onPress={() => router.push('/(tabs)/trace')}
          style={{ width: '100%', marginTop: 10 }}
        />
        <Button label={`← ${t('back_home')}`} onPress={() => router.replace('/')} style={{ width: '100%', marginTop: 10 }} />
        </ScrollView>
      </CurvedSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.jade },
  heroGrad: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
  },
  sheet: { flex: 1, marginTop: -20 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  checkAnim: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  checkMark: { fontSize: 42, color: '#fff', fontWeight: '700' },
  confirmTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  bookingRef: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 10, fontFamily: fonts.body },
  nextHint: {
    fontSize: 12,
    color: colors.text2,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 18,
    fontFamily: fonts.body,
  },
  code: { color: '#fff', fontWeight: '700', fontFamily: fonts.display },
  card: {
    backgroundColor: colors.card,
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
  reviewTitle: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 12, fontFamily: fonts.body },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  starPick: { fontSize: 30, color: colors.text3 },
  starOn: { color: colors.amber },
});
