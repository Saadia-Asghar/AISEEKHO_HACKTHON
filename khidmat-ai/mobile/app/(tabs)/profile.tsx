import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, fonts, gradients, radius, shadows, spacing } from '../../constants/theme';
import CurvedSheet from '../../components/ui/CurvedSheet';
import { clearSession, getSession, type Session } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import LanguagePicker from '../../components/LanguagePicker';
import { showToast } from '../../lib/toastStore';
import Avatar from '../../components/Avatar';
import Badge from '../../components/ui/Badge';
import GoogleBadge from '../../components/GoogleBadge';
import OnboardingModal from '../../components/OnboardingModal';
import { getUserReviews } from '../../api/client';
import { HOW_TO_SECTIONS } from '../../constants/guide';
import NavShortcuts from '../../components/NavShortcuts';
import GoogleStatusBanner from '../../components/GoogleStatusBanner';

type Review = { rating: number; comment?: string; provider_name?: string };

const MENU = [
  { icon: '📖', label: 'How to use KhidmatAI', sub: 'Step-by-step guide', bg: colors.violetSoft, action: 'guide' as const },
  { icon: '📋', label: 'My Bookings', sub: 'View upcoming', bg: colors.jadeSoft, route: '/(tabs)/bookings' as const },
  { icon: '⭐', label: 'My Reviews', sub: 'Reviews given', bg: colors.amberSoft, action: 'reviews' as const },
  { icon: '💬', label: 'Help & Support', sub: 'support@khidmat.ai', bg: 'rgba(59,130,246,0.1)', action: 'help' as const },
  { icon: '🔒', label: 'Privacy', sub: 'Data & permissions', bg: 'rgba(160,155,192,0.1)', action: 'privacy' as const },
];

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const { lang, t } = useI18n();
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
      <LinearGradient colors={[...gradients.hero]} style={styles.heroGrad}>
        <View style={styles.profileAv}>
          <Avatar name={session.name} size={84} />
        </View>
        <Text style={styles.nameHero}>{session.name}</Text>
        <Text style={styles.subHero}>{session.phone} · Karachi</Text>
        <View style={styles.badges}>
          <Badge label={`⭐ ${reviews.length} Reviews`} variant="violet" />
          <Badge label="✓ Verified" variant="jade" />
        </View>
      </LinearGradient>
      <CurvedSheet style={styles.sheet}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GoogleStatusBanner />
        <NavShortcuts />
        <View style={styles.navCard}>
          <Text style={styles.navTitle}>{t('profile_nav')}</Text>
          <Text style={styles.navRow}>🏠 {t('profile_home')}</Text>
          <Text style={styles.navRow}>📋 {t('profile_bookings')}</Text>
          <Text style={styles.navRow}>🧠 {t('profile_trace')}</Text>
          <Text style={styles.navRow}>👤 {t('profile_account')}</Text>
        </View>

        <View style={styles.divider} />

        {MENU.map((item) => (
          <Pressable
            key={item.label}
            style={styles.menuItem}
            onPress={async () => {
              if (item.action === 'guide') {
                setShowHowTo((v) => !v);
              } else if (item.route) {
                router.push(item.route);
              } else if (item.action === 'reviews') {
                setShowReviews((v) => !v);
              } else if (item.action === 'help') {
                setShowGuide(true);
              } else if (item.action === 'privacy') {
                Alert.alert('Privacy', 'Your data stays on device and our secure API.');
              }
            }}
          >
            <View style={[styles.miIcon, { backgroundColor: item.bg }]}>
              <Text>{item.icon}</Text>
            </View>
            <View style={styles.miText}>
              <Text style={styles.miStrong}>{item.label}</Text>
              <Text style={styles.miSmall}>{item.sub}</Text>
            </View>
            <Text style={styles.miArrow}>{item.action === 'guide' && showHowTo ? '▼' : '›'}</Text>
          </Pressable>
        ))}

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
            <Pressable onPress={() => setShowGuide(true)} style={styles.replayBtn}>
              <Text style={styles.replayText}>▶ Replay welcome tour</Text>
            </Pressable>
          </View>
        ) : null}

        {showReviews ? (
          <View style={styles.reviews}>
            {reviews.length === 0 ? (
              <Text style={styles.miSmall}>No reviews yet — rate a provider after booking</Text>
            ) : (
              reviews.map((r, i) => (
                <View key={i} style={styles.reviewCard}>
                  <Text style={styles.stars}>{'★'.repeat(r.rating)}</Text>
                  <Text style={styles.miSmall}>{r.provider_name}</Text>
                  {r.comment ? <Text style={styles.revText}>{r.comment}</Text> : null}
                </View>
              ))
            )}
          </View>
        ) : null}

        <Pressable
          style={styles.menuItem}
          onPress={async () => {
            await clearSession();
            router.replace('/auth');
          }}
        >
          <View style={[styles.miIcon, { backgroundColor: colors.roseSoft }]}>
            <Text>🚪</Text>
          </View>
          <View style={styles.miText}>
            <Text style={[styles.miStrong, { color: colors.rose }]}>Logout</Text>
          </View>
          <Text style={[styles.miArrow, { color: colors.rose }]}>›</Text>
        </Pressable>

        <GoogleBadge />
        <Text style={styles.version}>KhidmatAI v2.0 · Karachi, Pakistan</Text>
      </ScrollView>
      </CurvedSheet>
      <OnboardingModal visible={showGuide} onClose={() => setShowGuide(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.violetDeep },
  heroGrad: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
  },
  sheet: { flex: 1, marginTop: -20 },
  scroll: { paddingBottom: 110, paddingTop: spacing.md },
  profileAv: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  nameHero: { fontFamily: fonts.display, fontSize: 22, fontWeight: '700', color: '#fff' },
  subHero: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontFamily: fonts.body },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  navCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text3,
    marginBottom: 8,
    fontFamily: fonts.body,
  },
  navRow: { fontSize: 13, color: colors.text2, marginBottom: 4, fontFamily: fonts.body },
  langSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.text3,
    marginBottom: 8,
    fontFamily: fonts.body,
  },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  miIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miText: { flex: 1 },
  miStrong: { fontSize: 14, fontWeight: '500', color: colors.text, fontFamily: fonts.body },
  miSmall: { fontSize: 12, color: colors.text3, marginTop: 2, fontFamily: fonts.body },
  miArrow: { color: colors.text3, fontSize: 18 },
  howTo: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  howSection: { marginBottom: spacing.md },
  howTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.violetBright,
    marginBottom: 6,
    fontFamily: fonts.body,
  },
  howStep: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 20,
    marginBottom: 4,
    paddingLeft: 4,
    fontFamily: fonts.body,
  },
  replayBtn: { paddingVertical: spacing.sm, alignItems: 'center' },
  replayText: { color: colors.violetBright, fontWeight: '600', fontSize: 13, fontFamily: fonts.body },
  reviews: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  reviewCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.r,
    marginBottom: spacing.sm,
  },
  stars: { color: colors.amber, marginBottom: 4 },
  revText: { color: colors.text2, fontSize: 13, marginTop: 4, fontFamily: fonts.body },
  version: { textAlign: 'center', fontSize: 11, color: colors.text3, marginTop: 8, fontFamily: fonts.body },
  link: { color: colors.violetBright, fontFamily: fonts.body },
});
