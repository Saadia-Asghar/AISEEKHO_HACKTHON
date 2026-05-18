import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../../constants/theme';
import { useBookingStore } from '../../lib/store';
import { getSessionTrace } from '../../api/client';
import type { OrchestrateResult } from '../../api/client';

const STEPS = [
  { key: 'intent', icon: '🧠', title: 'Intent', match: /intent/i },
  { key: 'discovery', icon: '🔍', title: 'Discovery', match: /discovery|provider/i },
  { key: 'ranking', icon: '⚖️', title: 'Ranking', match: /ranking/i },
  { key: 'booking', icon: '📅', title: 'Booking', match: /booking/i },
  { key: 'follow', icon: '🔔', title: 'Follow-up', match: /follow/i },
  { key: 'summary', icon: '📋', title: 'Summary', match: /trace|summary/i },
];

function matchStep(agent: string) {
  return STEPS.find((s) => s.match.test(agent));
}

export default function TraceScreen() {
  const { result } = useBookingStore();
  const [trace, setTrace] = useState<OrchestrateResult['trace']>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const local = result?.trace ?? [];
    setTrace(local);
    if (!result?.session_id) return;
    setLoading(true);
    getSessionTrace(result.session_id)
      .then((data) => {
        if (data.trace?.length) setTrace(data.trace);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [result?.session_id, result?.trace]);

  const timeline = useMemo(() => {
    let activeSet = false;
    return STEPS.map((step) => {
      const entry = trace.find((t) => matchStep(t.agent)?.key === step.key);
      let status: 'completed' | 'active' | 'pending' = 'pending';
      if (entry) status = 'completed';
      else if (!activeSet && trace.length) {
        status = 'active';
        activeSet = true;
      }
      return {
        ...step,
        reasoning: entry?.reasoning || 'Run a search from Home to see agent steps.',
        timestamp: entry?.timestamp?.slice(11, 19) || '—',
        status,
      };
    });
  }, [trace]);

  const copyTrace = async () => {
    await Clipboard.setStringAsync(JSON.stringify(trace, null, 2));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <Text style={styles.badge}>🤖 Gemini intent · Google Maps discovery</Text>
          <Pressable style={styles.copyBtn} onPress={copyTrace}>
            <Text style={styles.copyText}>Copy Trace</Text>
          </Pressable>
        </View>
        {loading ? <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.md }} /> : null}

        {timeline.map((step) => {
          const isOpen = expanded[step.key];
          const circleStyle =
            step.status === 'completed'
              ? styles.circleDone
              : step.status === 'active'
                ? styles.circleActive
                : styles.circlePending;
          return (
            <View key={step.key} style={styles.step}>
              <View style={styles.stepHead}>
                <View style={[styles.circle, circleStyle]}>
                  <Text>{step.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.time}>{step.timestamp}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setExpanded((e) => ({ ...e, [step.key]: !e[step.key] }))}
                style={styles.reasonBox}
              >
                <Text style={styles.reason} numberOfLines={isOpen ? undefined : 2}>
                  {step.reasoning}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  badge: { color: colors.muted, fontSize: 11, flex: 1 },
  copyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  copyText: { color: colors.primary, fontWeight: '600' },
  step: { marginBottom: spacing.lg },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: colors.success + '33', borderWidth: 2, borderColor: colors.success },
  circleActive: { backgroundColor: colors.primary + '33', borderWidth: 2, borderColor: colors.primary },
  circlePending: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  stepTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
  time: { color: colors.muted, fontSize: 11 },
  reasonBox: {
    marginLeft: 56,
    marginTop: spacing.sm,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  reason: { color: colors.muted, fontSize: 13, lineHeight: 20 },
});
