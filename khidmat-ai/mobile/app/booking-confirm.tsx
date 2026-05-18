import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { colors, radius, spacing } from '../constants/theme';
import { useBookingStore } from '../lib/store';
import { getSession } from '../lib/auth';
import { postReview } from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function BookingConfirmScreen() {
  const { result } = useBookingStore();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewDone, setReviewDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!result) {
      router.replace('/');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [result]);

  if (!result) return null;

  const b = result.booking;
  const code = b.booking_id?.startsWith('KHI') ? b.booking_id : `KHI-${(b.booking_id || '000000').slice(-6).toUpperCase()}`;

  const setReminder = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'KhidmatAI reminder',
        body: `Your ${result.intent.service_label} with ${b.provider_name} is in 1 hour`,
      },
      trigger: { seconds: 3600 },
    });
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
      });
      setReviewDone(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.inner}>
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          <Text style={styles.check}>✓</Text>
        </Animated.View>
        <Text style={styles.title}>Booking confirmed!</Text>

        <View style={styles.card}>
          <Text style={styles.row}>{b.provider_name}</Text>
          <Text style={styles.sub}>{result.intent.service_label}</Text>
          <Text style={styles.sub}>📅 {b.slot}</Text>
          <Text style={styles.code}>🔑 {code}</Text>
        </View>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>Rate your provider</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} disabled={reviewDone}>
                <Text style={styles.star}>{n <= rating ? '⭐' : '☆'}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.comment}
            placeholder="Optional comment"
            placeholderTextColor={colors.muted}
            value={comment}
            onChangeText={setComment}
            editable={!reviewDone}
          />
          <Pressable
            style={[styles.reviewBtn, (submitting || reviewDone) && { opacity: 0.5 }]}
            onPress={submitReview}
            disabled={submitting || reviewDone}
          >
            <Text style={styles.reviewBtnText}>
              {reviewDone ? 'Review saved ✓' : submitting ? 'Saving…' : 'Submit review'}
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.btnOutline} onPress={setReminder}>
          <Text style={styles.btnOutlineText}>Set Reminder</Text>
        </Pressable>

        <Link href="/(tabs)/trace" asChild>
          <Pressable style={styles.btnOutline}>
            <Text style={styles.btnOutlineText}>View Full Trace</Text>
          </Pressable>
        </Link>

        <Pressable style={styles.btn} onPress={() => router.replace('/')}>
          <Text style={styles.btnText}>Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  check: {
    fontSize: 64,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '800',
    width: 88,
    height: 88,
    lineHeight: 88,
    backgroundColor: colors.card,
    borderRadius: 44,
    overflow: 'hidden',
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: spacing.md, marginBottom: spacing.lg },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.muted, marginTop: spacing.sm },
  code: { color: colors.primary, marginTop: spacing.md, fontWeight: '700', fontSize: 16 },
  reviewCard: {
    width: '100%',
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  reviewTitle: { color: colors.text, fontWeight: '700', marginBottom: spacing.sm },
  stars: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  star: { fontSize: 28 },
  comment: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  reviewBtn: {
    backgroundColor: colors.accent,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  reviewBtnText: { color: colors.text, fontWeight: '700' },
  btnOutline: {
    width: '100%',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  btnOutlineText: { color: colors.text, fontWeight: '600' },
  btn: {
    width: '100%',
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  btnText: { color: colors.text, fontWeight: '800' },
});
