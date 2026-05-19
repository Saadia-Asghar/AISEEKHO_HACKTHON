import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { clearSession, getSession, type Session } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import LanguagePicker from '../../components/LanguagePicker';
import { showToast } from '../../lib/toastStore';
import Avatar from '../../components/Avatar';
import GoogleBadge from '../../components/GoogleBadge';
import OnboardingModal from '../../components/OnboardingModal';
import { getUserReviews } from '../../api/client';
import { HOW_TO_SECTIONS } from '../../constants/guide';
import GoogleStatusBanner from '../../components/GoogleStatusBanner';
import StitchAppHeader from '../../components/stitch/StitchAppHeader';
import StitchGlassCard from '../../components/stitch/StitchGlassCard';
import StitchSectionLabel from '../../components/stitch/StitchSectionLabel';

type Review = { rating: number; comment?: string; provider_name?: string };

const SETTINGS = [
  { icon: '🌐', label: 'Language', bg: colors.violetSoft, action: 'lang' as const },
  { icon: '⭐', label: 'My Reviews', bg: colors.jadeSoft, action: 'reviews' as const },
  { icon: '❓', label: 'Help & Support', bg: colors.amberSoft, action: 'help' as const },
];

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const { t } = useI18n();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const load = useCallback(async () => {
    const s = await getSession();
    setSession(s);
    if (s) {
      try {
        setReviews(await getUserReviews(s.userId));
      } catch {
        setReviews([]);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
      : '—';

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={() => router.replace('/auth')} style={{ padding: spacing.lg }}>
          <Text style={styles.link}>Sign in</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StitchAppHeader />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHero}>
          <View style={styles.avWrap}>
            <Avatar name={session.name} size={88} />
            <View style={styles.editBadge}>
              <Text style={styles.editIcon}>✎</Text>
            </View>
          </View>
          <Text style={styles.nameHero}>{session.name}</Text>
          <Text style={styles.subHero}>{session.phone}</Text>
        </View>

        <View style={styles.statsRow}>
          <StitchGlassCard style={styles.statCard}>
            <Text style={[styles.statN, { color: colors.primaryText }]}>—</Text>
            <Text style={styles.statL}>BOOKINGS</Text>
          </StitchGlassCard>
          <StitchGlassCard style={styles.statCard}>
            <Text style={[styles.statN, { color: colors.jade }]}>{avgRating}</Text>
            <Text style={styles.statL}>RATING</Text>
          </StitchGlassCard>
        </View>

        <GoogleStatusBanner />
        <StitchSectionLabel>Account Settings</StitchSectionLabel>
        <StitchGlassCard style={styles.settingsCard}>
          {SETTINGS.map((item, i) => (
            <Pressable
              key={item.label}
              style={[styles.settingRow, i < SETTINGS.length - 1 && styles.settingBorder]}
              onPress={() => {
                if (item.action === 'lang') return;
                if (item.action === 'reviews') setShowReviews((v) => !v);
                if (item.action === 'help') setShowGuide(true);
              }}
            >
              <View style={[styles.settingIcon, { backgroundColor: item.bg }]}>
                <Text>{item.icon}</Text>
              </View>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Text style={styles.settingArrow}>›</Text>
            </Pressable>
          ))}
          <View style={styles.langPad}>
            <LanguagePicker />
          </View>
        </StitchGlassCard>

        {showReviews ? (
          <View style={styles.reviews}>
            {reviews.length === 0 ? (
              <Text style={styles.miSmall}>No reviews yet — rate a provider after booking</Text>
            ) : (
              reviews.map((r, i) => (
                <StitchGlassCard key={i} style={styles.reviewCard}>
                  <Text style={styles.stars}>{'★'.repeat(r.rating)}</Text>
                  <Text style={styles.miSmall}>{r.provider_name}</Text>
                  {r.comment ? <Text style={styles.revText}>{r.comment}</Text> : null}
                </StitchGlassCard>
              ))
            )}
          </View>
        ) : null}

        <Pressable
          style={styles.logoutBtn}
          onPress={async () => {
            await clearSession();
            router.replace('/auth');
          }}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Pressable onPress={() => setShowHowTo((v) => !v)} style={styles.howLink}>
          <Text style={styles.howLinkText}>{showHowTo ? '▼' : '▶'} {t('how_to')}</Text>
        </Pressable>
        {showHowTo ? (
          <View style={styles.howTo}>
            {HOW_TO_SECTIONS.map((sec) => (
              <View key={sec.title} style={styles.howSection}>
                <Text style={styles.howTitle}>{sec.title}</Text>
                {sec.steps.map((step, i) => (
                  <Text key={i} style={styles.howStep}>
                    {step}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        <GoogleBadge />
        <Text style={styles.version}>KhidmatAI v2.0 · Karachi, Pakistan</Text>
      </ScrollView>
      <OnboardingModal visible={showGuide} onClose={() => setShowGuide(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 110 },
  profileHero: { alignItems: 'center', paddingVertical: spacing.lg },
  avWrap: { position: 'relative', marginBottom: spacing.md },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryText,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  editIcon: { fontSize: 14, color: colors.bg, fontWeight: '700' },
  nameHero: { fontFamily: fonts.display, fontSize: 22, fontWeight: '700', color: colors.text },
  subHero: { fontSize: 14, color: colors.text2, marginTop: 4, fontFamily: fonts.body },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statN: { fontFamily: fonts.display, fontSize: 28, fontWeight: '700' },
  statL: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.text2,
    marginTop: 4,
    fontFamily: fonts.body,
  },
  settingsCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, paddingVertical: 4 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text, fontFamily: fonts.body },
  settingArrow: { color: colors.text3, fontSize: 18 },
  langPad: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  reviews: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  reviewCard: { padding: spacing.md },
  stars: { color: colors.amber, marginBottom: 4 },
  miSmall: { fontSize: 12, color: colors.text3, fontFamily: fonts.body },
  revText: { color: colors.text2, fontSize: 13, marginTop: 4, fontFamily: fonts.body },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.surface,
  },
  logoutIcon: { fontSize: 18 },
  logoutText: { color: colors.rose, fontWeight: '600', fontSize: 15, fontFamily: fonts.body },
  howLink: { alignItems: 'center', padding: spacing.md },
  howLinkText: { color: colors.primaryText, fontWeight: '600', fontFamily: fonts.body },
  howTo: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  howSection: { marginBottom: spacing.md },
  howTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 6,
    fontFamily: fonts.body,
  },
  howStep: { fontSize: 13, color: colors.text2, lineHeight: 20, marginBottom: 4, fontFamily: fonts.body },
  version: { textAlign: 'center', fontSize: 11, color: colors.text3, marginTop: 8, fontFamily: fonts.body },
  link: { color: colors.primaryText, fontFamily: fonts.body },
});
