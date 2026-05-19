import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useBookingStore } from '../../lib/store';
import { getSessionTrace } from '../../api/client';
import type { OrchestrateResult } from '../../api/client';
import Badge from '../../components/ui/Badge';
import GoogleBadge from '../../components/GoogleBadge';
import ScreenGuide from '../../components/ScreenGuide';
import TipCard from '../../components/TipCard';
import CurvedSheet from '../../components/ui/CurvedSheet';
import { useI18n } from '../../lib/i18n';

const ICONS: Record<string, { icon: string; tone: 'jade' | 'violet' | 'amber' | 'gray' }> = {
  intent: { icon: '🎤', tone: 'jade' },
  discovery: { icon: '📍', tone: 'amber' },
  ranking: { icon: '🧮', tone: 'violet' },
  booking: { icon: '🔔', tone: 'jade' },
  follow: { icon: '🔔', tone: 'jade' },
  summary: { icon: '✅', tone: 'jade' },
};

const STEPS = [
  { key: 'intent', match: /intent/i },
  { key: 'discovery', match: /discovery|provider/i },
  { key: 'ranking', match: /ranking/i },
  { key: 'booking', match: /booking/i },
  { key: 'follow', match: /follow/i },
  { key: 'summary', match: /trace|summary/i },
];

function matchStep(agent: string) {
  return STEPS.find((s) => s.match.test(agent))?.key ?? 'intent';
}

export default function TraceScreen() {
  const { t } = useI18n();
  const { result } = useBookingStore();
  const [trace, setTrace] = useState<OrchestrateResult['trace']>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTrace(result?.trace ?? []);
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
    return trace.map((entry, i) => {
      const key = matchStep(entry.agent);
      const meta = ICONS[key] ?? ICONS.intent;
      return {
        key: `${key}-${i}`,
        icon: meta.icon,
        tone: meta.tone,
        title: entry.agent.replace(/_/g, ' '),
        body: entry.reasoning,
        time: entry.timestamp?.slice(11, 19) || `Step ${i + 1}`,
        done: true,
      };
    });
  }, [trace]);

  const copyTrace = async () => {
    await Clipboard.setStringAsync(JSON.stringify(trace, null, 2));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const displaySteps =
    timeline.length > 0
      ? timeline
      : [
          {
            key: 'empty',
            icon: '🧠',
            tone: 'gray' as const,
            title: t('trace_empty'),
            body: t('trace_sub'),
            time: '—',
            done: false,
          },
        ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenGuide title={t('trace_title')} subtitle={t('trace_sub')} />
      <CurvedSheet style={styles.sheet}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.tipPad}>
          <TipCard
            tipId="trace_empty"
          title="No steps yet?"
          message="Go to Home → Try Demo or Book Now. Your latest AI reasoning appears here automatically."
          actionLabel="Go to Home →"
          onAction={() => router.push('/')}
          />
        </View>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Live trace</Text>
          <View style={styles.gBadge}>
            <Text style={styles.gLetter}>G</Text>
            <Text style={styles.gText}>Google AI</Text>
          </View>
        </View>

        <View style={styles.badgesRow}>
          <Badge label={`✓ ${displaySteps.length} Steps`} variant="jade" />
          <Pressable style={styles.copyBtn} onPress={copyTrace}>
            <Text style={styles.copyText}>📋 Copy</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator color={colors.violet} style={{ marginBottom: spacing.md }} /> : null}

        <View style={styles.timeline}>
          {displaySteps.map((step, idx) => (
            <View key={step.key} style={styles.tlItem}>
              <View style={styles.tlLeft}>
                <View style={[styles.tlIcon, styles[`icon_${step.tone}`]]}>
                  <Text>{step.icon}</Text>
                </View>
                {idx < displaySteps.length - 1 ? <View style={styles.tlLine} /> : null}
              </View>
              <View style={styles.tlBody}>
                <Text style={styles.tlStepLabel}>{step.time}</Text>
                <View style={[styles.tlCard, step.done && styles.tlCardDone]}>
                  <Text style={styles.tlCardTitle}>{step.title}</Text>
                  <Text style={styles.tlCardBody}>{step.body}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <GoogleBadge />
      </ScrollView>
      </CurvedSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.violetDeep },
  sheet: { flex: 1, marginTop: -20 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 110, paddingTop: spacing.md },
  tipPad: { marginBottom: spacing.sm },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pageTitle: { fontFamily: fonts.display, fontSize: 17, fontWeight: '600', color: colors.text },
  gBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 20,
  },
  gLetter: { fontSize: 13, fontWeight: '800', color: '#4285F4' },
  gText: { fontSize: 11, fontWeight: '600', color: colors.text2, fontFamily: fonts.body },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  copyBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: radius.md,
  },
  copyText: { color: colors.text2, fontSize: 12, fontFamily: fonts.body },
  timeline: { paddingTop: 8 },
  tlItem: { flexDirection: 'row', gap: 14, marginBottom: 4 },
  tlLeft: { alignItems: 'center' },
  tlIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  icon_jade: { backgroundColor: colors.jadeSoft, borderColor: 'rgba(46,196,169,0.2)' },
  icon_violet: { backgroundColor: colors.violetSoft, borderColor: 'rgba(123,94,167,0.2)' },
  icon_amber: { backgroundColor: colors.amberSoft, borderColor: 'rgba(232,168,56,0.2)' },
  icon_gray: { backgroundColor: 'rgba(160,155,192,0.08)', borderColor: colors.border },
  tlLine: { width: 1, flex: 1, minHeight: 16, backgroundColor: colors.border, marginVertical: 4 },
  tlBody: { flex: 1, paddingBottom: 20 },
  tlStepLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text3,
    marginBottom: 5,
    fontFamily: fonts.body,
  },
  tlCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.r,
    padding: 12,
  },
  tlCardDone: { borderColor: 'rgba(46,196,169,0.25)', backgroundColor: 'rgba(46,196,169,0.05)' },
  tlCardTitle: { fontWeight: '600', fontSize: 14, color: colors.text, marginBottom: 4, fontFamily: fonts.body },
  tlCardBody: { fontSize: 12, color: colors.text2, lineHeight: 18, fontFamily: fonts.body },
});
