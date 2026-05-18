import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../constants/theme';

const PHASE_COLORS: Record<string, string> = {
  planning: colors.primary,
  decision: colors.warning,
  action: colors.success,
  follow_up: colors.muted,
};

export default function TraceScreen() {
  const result = useAppStore((s) => s.result);

  if (!result?.trace?.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.muted}>No trace available.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {result.trace_summary?.human_readable ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Workflow summary</Text>
          <Text style={styles.summaryText}>{result.trace_summary.outcome}</Text>
          <Text style={styles.stepCount}>{result.trace_summary.steps} agents · {result.trace.length} steps logged</Text>
        </View>
      ) : null}

      {result.trace.map((t, i) => (
        <View
          key={`${t.agent}-${i}`}
          style={[styles.traceCard, { borderLeftColor: PHASE_COLORS[t.phase] || colors.primary }]}
        >
          <Text style={styles.agent}>{t.agent}</Text>
          <Text style={styles.phase}>
            {t.phase} · {t.action}
          </Text>
          <Text style={styles.reason}>{t.reasoning}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  muted: { color: colors.muted },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: { color: colors.primary, fontWeight: '700', marginBottom: 6 },
  summaryText: { color: colors.text, lineHeight: 22 },
  stepCount: { color: colors.dim, fontSize: 12, marginTop: 8 },
  traceCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  agent: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  phase: { color: colors.dim, fontSize: 12, marginTop: 4 },
  reason: { color: '#e2e8f0', marginTop: 10, lineHeight: 20 },
});
