import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../hooks/useTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { ThemeColors } from '../constants/theme';
import { FONT_BOLD, FONT_REGULAR, RADIUS_XL } from '../constants/theme';

const AGENT_ICONS: Record<string, string> = {
  'Intent Agent': '🎯',
  'Discovery Agent': '🔍',
  'Ranking Agent': '⭐',
  'Booking Agent': '📅',
  'Follow-up Agent': '🔔',
  'Trace Agent': '📋',
};

export default function TraceScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const result = useAppStore((s) => s.result);

  const phaseColor = (phase: string) => {
    const map: Record<string, string> = {
      planning: colors.primary,
      decision: colors.accent,
      action: colors.success,
      follow_up: colors.muted,
    };
    return map[phase] || colors.primary;
  };

  if (!result?.trace?.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.muted}>No agent trace available.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {result.trace_summary?.outcome ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Workflow</Text>
          <Text style={styles.summaryText}>{result.trace_summary.outcome}</Text>
        </View>
      ) : null}

      <View style={styles.timeline}>
        {result.trace.map((t, i) => (
          <View key={`${t.agent}-${i}`} style={styles.step}>
            <View style={styles.lineCol}>
              <View style={[styles.dot, { backgroundColor: phaseColor(t.phase) }]}>
                <Text style={styles.dotIcon}>{AGENT_ICONS[t.agent] || '🤖'}</Text>
              </View>
              {i < result.trace.length - 1 ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
            </View>
            <View style={[styles.card, { borderLeftColor: phaseColor(t.phase) }]}>
              <Text style={styles.agent}>{t.agent}</Text>
              <Text style={styles.phase}>
                {t.phase} · {t.action}
              </Text>
              <Text style={styles.reason}>{t.reasoning}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    muted: { color: colors.muted, fontFamily: FONT_REGULAR },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: RADIUS_XL,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryTitle: { color: colors.primary, fontWeight: '700', marginBottom: 6, fontFamily: FONT_BOLD },
    summaryText: { color: colors.text, lineHeight: 22, fontFamily: FONT_REGULAR },
    timeline: { paddingLeft: 4 },
    step: { flexDirection: 'row', marginBottom: 4 },
    lineCol: { width: 48, alignItems: 'center' },
    dot: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotIcon: { fontSize: 18 },
    line: { width: 2, flex: 1, minHeight: 24, marginVertical: 4 },
    card: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: RADIUS_XL,
      padding: 14,
      marginBottom: 12,
      marginLeft: 8,
      borderLeftWidth: 3,
    },
    agent: { color: colors.text, fontWeight: '700', fontSize: 15, fontFamily: FONT_BOLD },
    phase: { color: colors.dim, fontSize: 12, marginTop: 4, fontFamily: FONT_REGULAR },
    reason: { color: colors.muted, marginTop: 8, lineHeight: 20, fontFamily: FONT_REGULAR },
  });
