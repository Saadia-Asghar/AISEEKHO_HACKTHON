import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchExamples, orchestrate, OrchestrationResult } from './src/api/client';

const DEMO = 'Mujhe kal subah G-13 mein AC technician chahiye';

export default function App() {
  const [message, setMessage] = useState(DEMO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrchestrationResult | null>(null);
  const [examples, setExamples] = useState<string[]>([]);
  const [tab, setTab] = useState<'result' | 'trace' | 'receipt'>('result');

  useEffect(() => {
    fetchExamples().then(setExamples).catch(() => setExamples([DEMO]));
  }, []);

  const onSubmit = useCallback(async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await orchestrate(message.trim());
      setResult(data);
      setTab('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [message]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.badge}>KhidmatAI · Antigravity Hackathon 2026</Text>
        <Text style={styles.title}>KhidmatAI</Text>
        <Text style={styles.subtitle}>
          Speak your need. KhidmatAI handles the rest.
        </Text>

        <TextInput
          style={styles.input}
          multiline
          value={message}
          onChangeText={setMessage}
          placeholder="Describe the service you need..."
          placeholderTextColor="#64748b"
        />

        <View style={styles.chips}>
          {examples.slice(0, 3).map((ex) => (
            <Pressable key={ex} style={styles.chip} onPress={() => setMessage(ex)}>
              <Text style={styles.chipText} numberOfLines={1}>
                {ex.length > 42 ? ex.slice(0, 42) + '…' : ex}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.buttonText}>Run agent pipeline</Text>}
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {result ? (
          <>
            <View style={styles.tabs}>
              <Pressable style={[styles.tab, tab === 'result' && styles.tabActive]} onPress={() => setTab('result')}>
                <Text style={styles.tabLabel}>Result</Text>
              </Pressable>
              <Pressable style={[styles.tab, tab === 'trace' && styles.tabActive]} onPress={() => setTab('trace')}>
                <Text style={styles.tabLabel}>Trace</Text>
              </Pressable>
              <Pressable style={[styles.tab, tab === 'receipt' && styles.tabActive]} onPress={() => setTab('receipt')}>
                <Text style={styles.tabLabel}>Receipt</Text>
              </Pressable>
            </View>

            {tab === 'result' ? (
              <View style={styles.card}>
                <Row label="Service" value={result.intent.service_label} />
                <Row label="Location" value={result.intent.location} />
                <Row label="Time" value={result.intent.time_expression} />
                <Row label="Language" value={result.intent.language} />
                {result.intent.urgency ? <Text style={styles.urgent}>Urgent request</Text> : null}
                <View style={styles.divider} />
                <Text style={styles.cardTitle}>Top 3 providers</Text>
                {result.top_three?.map((p, i) => (
                  <Text key={i} style={styles.muted}>
                    {i + 1}. {p.name} — {p.distance_km} km, ★{p.rating}
                    {p.score != null ? `, score ${p.score}` : ''}
                  </Text>
                ))}
                <View style={styles.divider} />
                <Text style={styles.cardTitle}>Selected</Text>
                <Text style={styles.highlight}>{result.recommended.name}</Text>
                <Text style={styles.muted}>
                  {result.recommended.distance_km} km · ★ {result.recommended.rating}
                </Text>
                <View style={styles.divider} />
                <Row label="Booking ID" value={result.booking.booking_id} />
                <Row label="Slot" value={result.booking.slot} />
                <Row label="Status" value={result.booking.status} />
                <Text style={styles.confirm}>{result.booking.confirmation_message}</Text>
                <View style={styles.divider} />
                <Text style={styles.muted}>{result.follow_up.status_update}</Text>
              </View>
            ) : tab === 'trace' ? (
              <>
                {result.trace_summary?.outcome ? (
                  <Text style={styles.summary}>{result.trace_summary.outcome}</Text>
                ) : null}
                {result.trace.map((t, i) => (
                  <View key={i} style={styles.traceCard}>
                    <Text style={styles.traceAgent}>{t.agent}</Text>
                    <Text style={styles.tracePhase}>{t.phase} · {t.action}</Text>
                    <Text style={styles.traceReason}>{t.reasoning}</Text>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.card}>
                <Text style={styles.receipt}>{result.booking.receipt}</Text>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  badge: { color: '#38bdf8', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  title: { color: '#f8fafc', fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#94a3b8', marginTop: 6, marginBottom: 20, lineHeight: 20 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    color: '#f1f5f9',
    minHeight: 88,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '100%',
  },
  chipText: { color: '#94a3b8', fontSize: 12 },
  button: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  error: { color: '#f87171', marginTop: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 24, marginBottom: 12 },
  tab: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#334155' },
  tabLabel: { color: '#e2e8f0', fontWeight: '600' },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  highlight: { color: '#f8fafc', fontSize: 20, fontWeight: '700' },
  muted: { color: '#94a3b8', marginTop: 4, lineHeight: 20 },
  confirm: { color: '#cbd5e1', marginTop: 10, lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { color: '#64748b' },
  rowValue: { color: '#f1f5f9', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  traceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  traceAgent: { color: '#38bdf8', fontWeight: '700' },
  tracePhase: { color: '#64748b', fontSize: 12, marginTop: 2 },
  traceReason: { color: '#e2e8f0', marginTop: 8, lineHeight: 20 },
  summary: { color: '#38bdf8', marginBottom: 12, lineHeight: 20 },
  urgent: { color: '#fbbf24', marginTop: 8, fontWeight: '600' },
  receipt: { color: '#e2e8f0', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, lineHeight: 18 },
});
