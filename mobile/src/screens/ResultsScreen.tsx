import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { saveProvider, unsaveProvider } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import { useUserStore } from '../store/useUserStore';
import { colors } from '../constants/theme';
import type { HomeStackParamList } from '../navigation/HomeStackNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ResultsScreen() {
  const navigation = useNavigation<Nav>();
  const result = useAppStore((s) => s.result);
  const userId = useUserStore((s) => s.userId)!;
  const [saved, setSaved] = useState(result?.recommended.is_saved ?? false);

  if (!result) {
    return (
      <View style={styles.empty}>
        <Text style={styles.muted}>No result yet. Run a request from Home.</Text>
      </View>
    );
  }

  const providerId = result.recommended.id;

  const toggleSave = async () => {
    if (saved) {
      await unsaveProvider(userId, providerId);
      setSaved(false);
    } else {
      await saveProvider(userId, providerId);
      setSaved(true);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {result.personalization?.user_rating_influence ? (
        <View style={styles.personalCard}>
          <Text style={styles.personalTitle}>Personalized for you</Text>
          <Text style={styles.personalText}>{result.personalization.user_rating_influence}</Text>
        </View>
      ) : null}

      {result.trace_summary?.outcome ? (
        <Text style={styles.summary}>{result.trace_summary.outcome}</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.section}>Intent</Text>
        <Row label="Service" value={result.intent.service_label} />
        <Row label="Location" value={result.intent.location} />
        <Row label="Time" value={result.intent.time_expression} />
        <Row label="Language" value={result.intent.language} />
        {result.intent.urgency ? <Text style={styles.urgent}>Urgent request</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Top 3 providers</Text>
        {result.top_three?.map((p, i) => (
          <View key={(p.id || p.name) + i} style={styles.providerRow}>
            <Text style={styles.providerName}>
              {i + 1}. {p.name}
              {p.is_saved ? ' ⭐' : ''}
            </Text>
            <Text style={styles.muted}>
              {p.distance_km} km · ★{p.effective_rating ?? p.rating}
              {p.score != null ? ` · score ${p.score}` : ''}
              {p.your_rating ? ` · you: ${p.your_rating}★` : ''}
            </Text>
            {p.rank_reason ? (
              <Text style={styles.breakdown} numberOfLines={3}>
                {p.rank_reason}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      <View style={[styles.card, styles.selected]}>
        <Text style={styles.section}>Selected provider</Text>
        <Text style={styles.highlight}>{result.recommended.name}</Text>
        <Text style={styles.muted}>
          {result.recommended.distance_km} km · ★ {result.recommended.effective_rating ?? result.recommended.rating} ·{' '}
          {result.recommended.phone}
        </Text>
        <Pressable style={styles.saveBtn} onPress={toggleSave}>
          <Text style={styles.saveBtnText}>{saved ? '★ Saved to favorites' : '☆ Save worker'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Booking</Text>
        <Row label="ID" value={result.booking.booking_id} />
        <Row label="Slot" value={result.booking.slot} />
        <Row label="Status" value={result.booking.status} />
        <Row label="Payment" value={result.booking.payment_status || 'pending'} />
        {result.booking.amount_pkr ? <Row label="Amount" value={`PKR ${result.booking.amount_pkr}`} /> : null}
        <Text style={styles.confirm}>{result.booking.confirmation_message}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Follow-up</Text>
        <Text style={styles.muted}>{result.follow_up.status_update}</Text>
        <Row label="Reminder" value={result.follow_up.reminder_time} />
      </View>

      {result.notifications && result.notifications.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.section}>Notifications sent</Text>
          {result.notifications.map((n, i) => (
            <Text key={i} style={styles.muted}>
              {n.channel}: {n.status} → {n.to}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        {result.booking.payment_status !== 'paid' && result.payment ? (
          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('Payment')}>
            <Text style={styles.actionText}>Complete payment</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Rate')}
          disabled={!result.rate_booking && result.booking.payment_status !== 'paid'}
        >
          <Text style={styles.actionText}>Rate this worker</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('Trace')}>
          <Text style={styles.actionText}>View agent trace</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionSecondary]} onPress={() => navigation.navigate('Receipt')}>
          <Text style={styles.actionTextSecondary}>View receipt</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  personalCard: {
    backgroundColor: '#0c4a6e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  personalTitle: { color: colors.primary, fontWeight: '700', marginBottom: 4 },
  personalText: { color: '#bae6fd', fontSize: 13, lineHeight: 18 },
  summary: { color: colors.primary, marginBottom: 12, lineHeight: 22 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: { borderColor: colors.primary },
  section: { color: colors.dim, fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { color: colors.dim },
  rowValue: { color: colors.text, fontWeight: '600', maxWidth: '58%', textAlign: 'right' },
  highlight: { color: colors.text, fontSize: 22, fontWeight: '700' },
  muted: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  confirm: { color: '#cbd5e1', marginTop: 10, lineHeight: 22 },
  urgent: { color: colors.warning, marginTop: 8, fontWeight: '600' },
  providerRow: { marginBottom: 12 },
  providerName: { color: colors.text, fontWeight: '600' },
  breakdown: { color: colors.dim, fontSize: 11, marginTop: 4 },
  saveBtn: { marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: '#0f172a' },
  saveBtnText: { color: colors.warning, textAlign: 'center', fontWeight: '600' },
  actions: { gap: 10, marginTop: 8 },
  actionBtn: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary },
  actionText: { color: colors.bg, fontWeight: '700' },
  actionTextSecondary: { color: colors.primary, fontWeight: '700' },
});
