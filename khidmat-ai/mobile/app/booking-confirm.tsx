import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useBookingStore } from '../lib/store';
import { getSession } from '../lib/auth';
import { postReview } from '../api/client';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

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
  const scale = useRef(new Animated.Value(0)).current;
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
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [result]);

  if (!result) return null;

  const b = result.booking;
  const code = b.booking_id?.startsWith('KHI')
    ? b.booking_id
    : `KHI-${(b.booking_id || '000000').slice(-6).toUpperCase()}`;

  const setReminder = async () => {
    if (Platform.OS === 'web') {
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Animated.View style={[styles.checkAnim, { transform: [{ scale }] }]}>
            <Text style={styles.checkMark}>✓</Text>
          </Animated.View>
          <Text style={styles.confirmTitle}>Booking Confirmed!</Text>
          <Text style={styles.bookingRef}>
            Code: <Text style={styles.code}>{code}</Text>
          </Text>
          <Badge label={`${b.provider_name} · ${b.slot}`} variant="jade" />
        </View>

        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Location</Text>
            <Text style={styles.detailVal}>{result.intent.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏰ Time</Text>
            <Text style={styles.detailVal}>{b.slot}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>💰 Service</Text>
            <Text style={[styles.detailVal, { color: colors.jade, fontWeight: '700' }]}>
              {result.intent.service_label}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.reviewTitle}>Rate your experience</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} disabled={reviewDone}>
                <Text style={[styles.starPick, n <= rating && styles.starOn]}>
                  {n <= rating ? '★' : '☆'}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.comment}
            placeholder="Bahut acha kaam kiya…"
            placeholderTextColor={colors.text3}
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

        <Button label="🔔 Set Reminder" variant="outline" onPress={setReminder} style={{ width: '100%' }} />
        <Button
          label="🧠 View AI Trace"
          variant="outline"
          onPress={() => router.push('/(tabs)/trace')}
          style={{ width: '100%', marginTop: 10 }}
        />
        <Button label="← Back to Home" onPress={() => router.replace('/')} style={{ width: '100%', marginTop: 10 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  hero: { alignItems: 'center', paddingVertical: 36 },
  checkAnim: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.jade,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  checkMark: { fontSize: 44, color: '#fff', fontWeight: '700' },
  confirmTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  bookingRef: { fontSize: 13, color: colors.text3, marginBottom: 10, fontFamily: fonts.body },
  code: { color: colors.violetBright, fontWeight: '600', fontFamily: fonts.display },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
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
  comment: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.r,
    color: colors.text,
    padding: 14,
    marginBottom: 10,
    minHeight: 64,
    fontFamily: fonts.body,
  },
});
