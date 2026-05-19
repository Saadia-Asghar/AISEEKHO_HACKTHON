import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import type { AppColors } from '../../constants/theme';
import { fonts, radius, spacing } from '../../constants/theme';
import { useBookingStore } from '../../lib/store';
import { getSessionTrace } from '../../api/client';
import type { OrchestrateResult } from '../../api/client';
import GoogleBadge from '../../components/GoogleBadge';
import ScreenGuide from '../../components/ScreenGuide';
import StitchGlassCard from '../../components/stitch/StitchGlassCard';
import ThemedSafeArea from '../../components/ThemedSafeArea';
import { useI18n } from '../../lib/i18n';
import { useTheme } from '../../lib/ThemeContext';

const ICONS: Record<string, { icon: string; tone: 'done' | 'active' | 'pending' }> = {
  intent: { icon: '🔍', tone: 'done' },
  discovery: { icon: '📍', tone: 'done' },
  ranking: { icon: '🛡️', tone: 'active' },
  booking: { icon: '💳', tone: 'pending' },
  follow: { icon: '📅', tone: 'pending' },
  summary: { icon: '🚀', tone: 'pending' },
};

const STEPS = [
  { key: 'intent', match: /intent/i, fallbackTitle: 'Requirement Analysis' },
  { key: 'discovery', match: /discovery|provider/i, fallbackTitle: 'Finding Provider' },
  { key: 'ranking', match: /ranking/i, fallbackTitle: 'Verifying Background' },
  { key: 'booking', match: /booking/i, fallbackTitle: 'Negotiating Rate' },
  { key: 'follow', match: /follow/i, fallbackTitle: 'Scheduling ETA' },
  { key: 'summary', match: /trace|summary/i, fallbackTitle: 'Service Dispatch' },
];

function matchStep(agent: string) {
  return STEPS.find((s) => s.match.test(agent))?.key ?? 'intent';
}

export default function TraceScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => traceStyles(colors), [colors]);
  const { result } = useBookingStore();
  const [trace, setTrace] = useState<OrchestrateResult['trace']>([]);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(true);

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
      const stepMeta = STEPS.find((s) => s.key === key);
      return {
        key: `${key}-${i}`,
        icon: meta.icon,
        tone: i < trace.length - 1 ? ('done' as const) : meta.tone,
        title: entry.agent.replace(/_/g, ' ') || stepMeta?.fallbackTitle || 'Step',
        body: entry.reasoning,
        time: entry.timestamp?.slice(11, 19) || `Step ${i + 1}`,
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
            icon: '🔍',
            tone: 'pending' as const,
            title: t('trace_empty'),
            body: t('trace_sub'),
            time: '—',
          },
        ];

  return (
    <ThemedSafeArea edges={['top']}>
      <ScreenGuide
        title={t('trace_title')}
        subtitle={t('trace_subtitle')}
        right={
          <View style={styles.liveRow}>
            <Text style={styles.liveLabel}>{t('live')}</Text>
            <Switch value={live} onValueChange={setLive} trackColor={{ true: colors.jade }} />
          </View>
        }
      />
      <View style={styles.headActions}>
        <GoogleBadge compact />
        <Pressable style={styles.copyBtn} onPress={copyTrace}>
          <Text style={styles.copyText}>📋 {t('copy_trace')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator color={colors.violet} style={{ marginBottom: spacing.md }} /> : null}

        <View style={styles.timeline}>
          {displaySteps.map((step, idx) => (
            <View key={step.key} style={styles.tlItem}>
              <View style={styles.tlLeft}>
                <View
                  style={[
                    styles.tlIcon,
                    step.tone === 'done' && styles.iconDone,
                    step.tone === 'active' && styles.iconActive,
                    step.tone === 'pending' && styles.iconPending,
                  ]}
                >
                  <Text style={styles.tlIconText}>{step.icon}</Text>
                </View>
                {idx < displaySteps.length - 1 ? <View style={styles.tlLine} /> : null}
              </View>
              <StitchGlassCard
                style={
                  step.tone === 'active'
                    ? [styles.tlCard, styles.tlCardActive]
                    : step.tone === 'pending'
                      ? [styles.tlCard, styles.tlCardPending]
                      : styles.tlCard
                }
              >
                {step.tone === 'done' ? <Text style={styles.check}>✓</Text> : null}
                <Text style={styles.tlCardTitle}>{step.title}</Text>
                <Text style={styles.tlCardBody}>{step.body}</Text>
                {step.time !== '—' ? <Text style={styles.tlTime}>{step.time}</Text> : null}
              </StitchGlassCard>
            </View>
          ))}
        </View>

        <GoogleBadge />
      </ScrollView>
    </ThemedSafeArea>
  );
}

function traceStyles(colors: AppColors) {
  return StyleSheet.create({
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    liveLabel: { fontSize: 12, color: colors.jade, fontWeight: '600', fontFamily: fonts.body },
    headActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    copyBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border2,
      backgroundColor: colors.surface,
    },
    copyText: { color: colors.text, fontSize: 12, fontWeight: '600', fontFamily: fonts.body },
    scroll: { paddingHorizontal: spacing.lg, paddingBottom: 110 },
    timeline: { paddingTop: spacing.sm },
    tlItem: { flexDirection: 'row', gap: 14, marginBottom: spacing.md },
    tlLeft: { alignItems: 'center', width: 44 },
    tlIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    iconDone: { backgroundColor: colors.jadeSoft, borderColor: colors.jade },
    iconActive: { backgroundColor: colors.violetSoft, borderColor: colors.violet },
    iconPending: { backgroundColor: colors.surface, borderColor: colors.border2 },
    tlIconText: { fontSize: 18 },
    tlLine: { width: 2, flex: 1, minHeight: 24, backgroundColor: colors.border2, marginVertical: 4 },
    tlCard: { flex: 1, padding: spacing.md, marginBottom: 0 },
    tlCardActive: { borderColor: colors.violet, borderWidth: 2 },
    tlCardPending: { opacity: 0.85 },
    check: { position: 'absolute', top: 10, right: 12, color: colors.jade, fontWeight: '700' },
    tlCardTitle: { fontWeight: '600', fontSize: 15, color: colors.text, marginBottom: 6, fontFamily: fonts.body },
    tlCardBody: { fontSize: 13, color: colors.text2, lineHeight: 19, fontFamily: fonts.body },
    tlTime: { fontSize: 11, color: colors.text3, marginTop: 8, fontFamily: fonts.body },
  });
}
