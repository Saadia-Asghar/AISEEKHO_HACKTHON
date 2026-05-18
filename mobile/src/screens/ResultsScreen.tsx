import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../constants/theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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

  if (!result) {
    return (
      <View style={styles.empty}>
        <Text style={styles.muted}>No result yet. Run a request from Home.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
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
          <View key={p.name + i} style={styles.providerRow}>
            <Text style={styles.providerName}>
              {i + 1}. {p.name}
            </Text>
            <Text style={styles.muted}>
              {p.distance_km} km · ★{p.rating}
              {p.score != null ? ` · score ${p.score}` : ''}
            </Text>
            {p.rank_reason ? (
              <Text style={styles.breakdown} numberOfLines={2}>
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
          {result.recommended.distance_km} km · ★ {result.recommended.rating} · {result.recommended.phone}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Booking</Text>
        <Row label="ID" value={result.booking.booking_id} />
        <Row label="Slot" value={result.booking.slot} />
        <Row label="Status" value={result.booking.status} />
        <Text style={styles.confirm}>{result.booking.confirmation_message}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Follow-up</Text>
        <Text style={styles.muted}>{result.follow_up.status_update}</Text>
        <Row label="Reminder" value={result.follow_up.reminder_time} />
      </View>

      <View style={styles.actions}>
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
