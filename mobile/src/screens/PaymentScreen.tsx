import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { confirmPayment } from '../api/client';
import { notifyBookingConfirmed, requestNotificationPermission, scheduleReminder } from '../services/pushNotifications';
import { useAppStore } from '../store/useAppStore';
import { useUserStore } from '../store/useUserStore';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { ThemeColors } from '../constants/theme';
import type { HomeStackParamList } from '../navigation/HomeStackNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Payment'>;
type PayMethod = 'card' | 'jazzcash' | 'easypaisa';

export default function PaymentScreen() {
  const navigation = useNavigation<Nav>();
  const styles = useThemedStyles(createStyles);
  const result = useAppStore((s) => s.result);
  const { userId, phone } = useUserStore();
  const [method, setMethod] = useState<PayMethod>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{ channel: string; status: string }>>([]);

  if (!result?.payment) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No payment due.</Text>
      </View>
    );
  }

  const pay = result.payment;

  const onPay = async () => {
    setLoading(true);
    setError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await requestNotificationPermission();
      const res = await confirmPayment({
        paymentId: pay.payment_id,
        bookingId: pay.booking_id,
        method,
        userId: userId ?? undefined,
        customerPhone: phone ?? undefined,
        stripePaymentIntentId: pay.stripe_payment_intent_id ?? undefined,
      });
      setNotifications(res.notifications || []);
      await notifyBookingConfirmed(pay.booking_id, result.recommended.name);
      if (result.booking.slot) {
        await scheduleReminder(new Date().toISOString(), pay.booking_id);
      }
      useAppStore.getState().setResult({
        ...result,
        booking: { ...result.booking, status: 'CONFIRMED', payment_status: 'paid' },
        rate_booking: true,
        notifications: res.notifications,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => navigation.replace('Results'), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.amount}>PKR {pay.amount_pkr}</Text>
      <Text style={styles.muted}>Booking {pay.booking_id}</Text>
      <Text style={styles.muted}>
        {result.recommended.name} · {result.intent.service_label}
      </Text>

      <Text style={styles.section}>Payment method</Text>
      {(['card', 'jazzcash', 'easypaisa'] as PayMethod[]).map((m) => (
        <Pressable
          key={m}
          style={[styles.method, method === m && styles.methodActive]}
          onPress={() => setMethod(m)}
        >
          <Text style={styles.methodText}>
            {m === 'card' ? '💳 Card (Stripe)' : m === 'jazzcash' ? '📱 JazzCash' : '📱 Easypaisa'}
          </Text>
        </Pressable>
      ))}

      {pay.instructions ? <Text style={styles.instructions}>{pay.instructions}</Text> : null}

      <Text style={styles.section}>After payment</Text>
      <Text style={styles.muted}>SMS + WhatsApp confirmation to you and the provider (simulated without API keys).</Text>

      <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onPay} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Pay & send confirmations</Text>}
      </Pressable>

      {notifications.length > 0 ? (
        <View style={styles.notifBox}>
          {notifications.map((n, i) => (
            <Text key={i} style={styles.notifLine}>
              {n.channel}: {n.status}
            </Text>
          ))}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    amount: { color: colors.text, fontSize: 36, fontWeight: '800' },
    muted: { color: colors.muted, marginTop: 6 },
    section: { color: colors.dim, marginTop: 24, marginBottom: 10, fontWeight: '600' },
    method: {
      padding: 14,
      borderRadius: 10,
      backgroundColor: colors.card,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    methodActive: { borderColor: colors.primary },
    methodText: { color: colors.text },
    instructions: { color: colors.warning, marginTop: 12, fontSize: 13 },
    button: {
      backgroundColor: colors.success,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 24,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    notifBox: { marginTop: 16, padding: 12, backgroundColor: colors.card, borderRadius: 10 },
    notifLine: { color: colors.primary, marginBottom: 4 },
    error: { color: colors.error, marginTop: 12 },
  });
