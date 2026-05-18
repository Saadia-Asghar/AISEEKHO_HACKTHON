import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { clearSession, getLang, getSession, setLang, type Session } from '../../lib/auth';
import Avatar from '../../components/Avatar';
import Badge from '../../components/ui/Badge';
import GoogleBadge from '../../components/GoogleBadge';
import { getUserReviews } from '../../api/client';

type Review = { rating: number; comment?: string; provider_name?: string };

const MENU = [
  { icon: '🌐', label: 'Language', sub: 'Urdu · اردو', bg: colors.violetSoft },
  { icon: '📋', label: 'My Bookings', sub: 'View upcoming', bg: colors.jadeSoft, route: '/(tabs)/bookings' },
  { icon: '⭐', label: 'My Reviews', sub: 'Reviews given', bg: colors.amberSoft, action: 'reviews' },
  { icon: '💬', label: 'Help & Support', sub: 'Chat with us', bg: 'rgba(59,130,246,0.1)' },
  { icon: '🔒', label: 'Privacy', sub: 'Data & permissions', bg: 'rgba(160,155,192,0.1)' },
];

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [lang, setLangState] = useState<'en' | 'ur'>('en');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviews, setShowReviews] = useState(false);

  const load = useCallback(async () => {
    const s = await getSession();
    setSession(s);
    setLangState(await getLang());
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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.profileAv}>
            <Avatar name={session.name} size={84} />
          </View>
          <Text style={styles.name}>{session.name}</Text>
          <Text style={styles.sub}>{session.phone} · Karachi</Text>
          <View style={styles.badges}>
            <Badge label={`⭐ ${reviews.length} Reviews`} variant="violet" />
            <Badge label="✓ Verified" variant="jade" />
          </View>
        </View>

        <View style={styles.divider} />

        {MENU.map((item) => (
          <Pressable
            key={item.label}
            style={styles.menuItem}
            onPress={async () => {
              if (item.label === 'Language') {
                const next = lang === 'en' ? 'ur' : 'en';
                await setLang(next);
                setLangState(next);
              } else if (item.route) {
                router.push(item.route as '/(tabs)/bookings');
              } else if (item.action === 'reviews') {
                setShowReviews((v) => !v);
              } else if (item.label === 'Help & Support') {
                Alert.alert('Help', 'Email support@khidmat.ai');
              } else {
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
            <Text style={styles.miArrow}>›</Text>
          </Pressable>
        ))}

        {showReviews ? (
          <View style={styles.reviews}>
            {reviews.length === 0 ? (
              <Text style={styles.miSmall}>No reviews yet</Text>
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

        <Pressable style={styles.menuItem} onPress={async () => { await clearSession(); router.replace('/auth'); }}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 100 },
  hero: { alignItems: 'center', padding: spacing.lg },
  profileAv: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    marginBottom: 14,
  },
  name: { fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.text },
  sub: { fontSize: 12, color: colors.text2, marginTop: 4, fontFamily: fonts.body },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
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
