import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, radius, spacing } from '../../constants/theme';
import { clearSession, getLang, getSession, setLang, type Session } from '../../lib/auth';
import Avatar from '../../components/Avatar';
import { getUserReviews } from '../../api/client';

type Review = { rating: number; comment?: string; provider_name?: string };

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

  const toggleLang = async () => {
    const next = lang === 'en' ? 'ur' : 'en';
    await setLang(next);
    setLangState(next);
  };

  const logout = async () => {
    await clearSession();
    router.replace('/auth');
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={() => router.replace('/auth')}>
          <Text style={styles.link}>Sign in</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Avatar name={session.name} size={72} />
          <Text style={styles.name}>{session.name}</Text>
          <Text style={styles.phone}>{session.phone}</Text>
        </View>

        <Pressable style={styles.row} onPress={toggleLang}>
          <Text style={styles.rowLabel}>Language</Text>
          <Text style={styles.rowValue}>{lang === 'en' ? 'English ↔ اردو' : 'اردو ↔ English'}</Text>
        </Pressable>

        <Pressable style={styles.row} onPress={() => setShowReviews((v) => !v)}>
          <Text style={styles.rowLabel}>My Reviews</Text>
          <Text style={styles.rowValue}>{reviews.length}</Text>
        </Pressable>

        {showReviews ? (
          <View style={styles.reviews}>
            {reviews.length === 0 ? (
              <Text style={styles.muted}>No reviews yet</Text>
            ) : (
              reviews.map((r, i) => (
                <View key={i} style={styles.reviewCard}>
                  <Text style={styles.reviewStars}>{'⭐'.repeat(r.rating)}</Text>
                  <Text style={styles.muted}>{r.provider_name}</Text>
                  {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                </View>
              ))
            )}
          </View>
        ) : null}

        <Pressable style={styles.row} onPress={() => Alert.alert('Help', 'Email support@khidmat.ai')}>
          <Text style={styles.rowLabel}>Help</Text>
          <Text style={styles.rowValue}>›</Text>
        </Pressable>

        <Pressable style={[styles.row, styles.logout]} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  name: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: spacing.md },
  phone: { color: colors.muted, marginTop: spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowLabel: { color: colors.text, fontWeight: '600' },
  rowValue: { color: colors.muted },
  reviews: { marginBottom: spacing.md, paddingLeft: spacing.sm },
  reviewCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  reviewStars: { color: colors.text },
  reviewComment: { color: colors.text, marginTop: 4 },
  muted: { color: colors.muted },
  logout: { marginTop: spacing.lg, justifyContent: 'center' },
  logoutText: { color: colors.error, fontWeight: '700', width: '100%', textAlign: 'center' },
  link: { color: colors.primary, padding: spacing.lg },
});
