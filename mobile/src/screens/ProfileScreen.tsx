import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getUserProfile } from '../api/client';
import { clearStoredUser } from '../storage/userStorage';
import { useUserStore } from '../store/useUserStore';
import { colors } from '../constants/theme';

export default function ProfileScreen() {
  const { userId, displayName, clearUser } = useUserStore();
  const [stats, setStats] = useState<{
    bookings_count: number;
    ratings_count: number;
    saved_count: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const profile = await getUserProfile(userId);
      setStats({
        bookings_count: profile.bookings_count ?? 0,
        ratings_count: profile.ratings_count ?? 0,
        saved_count: profile.saved_count ?? 0,
      });
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onLogout = async () => {
    if (process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      try {
        const { getClerkInstance } = await import('@clerk/clerk-expo');
        await getClerkInstance()?.signOut();
      } catch {
        /* ignore */
      }
    }
    await clearStoredUser();
    clearUser();
  };

  return (
    <View style={styles.root}>
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.id}>{userId}</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : stats ? (
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.bookings_count}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.ratings_count}</Text>
            <Text style={styles.statLabel}>Ratings</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.saved_count}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.about}>
        KhidmatAI uses a 6-agent pipeline. Your ratings and saved workers personalize who we recommend
        (40% distance · 30% community rating · 25% availability · 5% your history).
      </Text>

      <Pressable style={styles.logout} onPress={onLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  name: { color: colors.text, fontSize: 26, fontWeight: '800' },
  id: { color: colors.dim, fontSize: 12, marginTop: 4, fontFamily: 'monospace' },
  stats: { flexDirection: 'row', marginTop: 28, gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNum: { color: colors.primary, fontSize: 28, fontWeight: '800' },
  statLabel: { color: colors.muted, marginTop: 4 },
  about: { color: colors.muted, marginTop: 28, lineHeight: 22 },
  logout: {
    marginTop: 32,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
  },
  logoutText: { color: colors.error, fontWeight: '600' },
});
