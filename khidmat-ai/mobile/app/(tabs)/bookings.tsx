import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { colors, radius, spacing } from '../../constants/theme';
import { getSession } from '../../lib/auth';
import { cancelBooking, getBookings } from '../../api/client';

type Tab = 'upcoming' | 'past' | 'cancelled';

type BookingRow = {
  id: string;
  service_type?: string;
  provider_name?: string;
  slot?: string;
  slot_datetime?: string;
  status?: string;
};

const EMOJI: Record<string, string> = {
  electrician: '💡',
  plumber: '🔧',
  ac_technician: '⚡',
  cleaner: '🧹',
  painter: '🎨',
  tutor: '📚',
  carpenter: '🪚',
};

export default function BookingsScreen() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const session = await getSession();
    if (!session) {
      router.replace('/auth');
      return;
    }
    try {
      const data = await getBookings(session.userId, tab);
      setRows(data as BookingRow[]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const onCancel = (id: string) => {
    Alert.alert('Cancel booking?', 'This cannot be undone.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          const session = await getSession();
          if (!session) return;
          await cancelBooking(id, session.userId);
          load();
        },
      },
    ]);
  };

  const onRebook = () => {
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.tabs}>
        {(['upcoming', 'past', 'cancelled'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => {
              setTab(t);
              setLoading(true);
            }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={rows.length ? styles.list : styles.emptyWrap}
        >
          {rows.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Link href="/" asChild>
                <Pressable style={styles.findBtn}>
                  <Text style={styles.findText}>Find a Service</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            rows.map((b) => {
              const svc = (b.service_type || 'service').toLowerCase();
              const emoji = EMOJI[svc] || '🔧';
              return (
                <View key={b.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.emoji}>{emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.svc}>{b.service_type || 'Service'}</Text>
                      <Text style={styles.provider}>{b.provider_name}</Text>
                      <Text style={styles.date}>{b.slot || b.slot_datetime}</Text>
                    </View>
                    <View style={[styles.badge, (b.status || '').includes('CANCEL') && styles.badgeCancel]}>
                      <Text style={styles.badgeText}>{b.status || 'PENDING'}</Text>
                    </View>
                  </View>
                  {tab === 'upcoming' ? (
                    <View style={styles.actions}>
                      <Pressable onPress={() => onCancel(b.id)}>
                        <Text style={styles.cancel}>Cancel</Text>
                      </Pressable>
                      <Pressable onPress={onRebook}>
                        <Text style={styles.rebook}>Rebook</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  tabTextActive: { color: colors.text },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  emoji: { fontSize: 28 },
  svc: { color: colors.text, fontWeight: '700' },
  provider: { color: colors.muted, marginTop: 2 },
  date: { color: colors.muted, fontSize: 12, marginTop: 4 },
  badge: {
    backgroundColor: colors.success + '33',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeCancel: { backgroundColor: colors.error + '33' },
  badgeText: { color: colors.text, fontSize: 10, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.sm },
  cancel: { color: colors.error, fontWeight: '600' },
  rebook: { color: colors.primary, fontWeight: '600' },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  findBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
  },
  findText: { color: colors.text, fontWeight: '700' },
});
