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
import { router } from 'expo-router';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { getSession } from '../../lib/auth';
import { cancelBooking, getBookings } from '../../api/client';
import Avatar from '../../components/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ScreenGuide from '../../components/ScreenGuide';
import TipCard from '../../components/TipCard';
import EmptyState from '../../components/EmptyState';

type Tab = 'upcoming' | 'past' | 'cancelled';

type BookingRow = {
  id: string;
  service_type?: string;
  provider_name?: string;
  slot?: string;
  slot_datetime?: string;
  status?: string;
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenGuide
        title="My Bookings"
        subtitle="Upcoming jobs, past history, and cancellations. Pull down to refresh."
      />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <TipCard
          tipId="bookings_tabs"
          title="Tabs explained"
          message="Upcoming = active jobs · Past = completed · Cancelled = ended by you"
        />
      </View>
      <View style={styles.tabsWrap}>
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
              {t === 'upcoming' ? 'Upcoming' : t === 'past' ? 'Past' : 'Cancelled'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.violet} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.violet} />
          }
          contentContainerStyle={rows.length ? styles.list : styles.emptyWrap}
        >
          {rows.length === 0 ? (
            <EmptyState
              icon={tab === 'cancelled' ? '🎉' : '📋'}
              title={tab === 'cancelled' ? 'No cancelled bookings' : 'No bookings yet'}
              message={
                tab === 'cancelled'
                  ? 'All your bookings are going great!'
                  : 'Complete a booking from Home (Try Demo is fastest). Your jobs will show here.'
              }
              actionLabel={tab !== 'cancelled' ? 'Book from Home' : undefined}
              onAction={tab !== 'cancelled' ? () => router.push('/') : undefined}
            />
          ) : (
            rows.map((b) => (
              <View key={b.id} style={styles.bCard}>
                <View style={styles.bCardTop}>
                  <Avatar name={b.provider_name || 'P'} size={46} square />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bName}>{b.provider_name}</Text>
                    <Text style={styles.bSub}>{b.service_type || 'Service'}</Text>
                    <Text style={styles.bDate}>{b.slot || b.slot_datetime}</Text>
                  </View>
                  <Badge
                    label={(b.status || 'PENDING').replace(/_/g, ' ')}
                    variant={(b.status || '').includes('CANCEL') ? 'rose' : 'jade'}
                  />
                </View>
                {tab === 'upcoming' ? (
                  <View style={styles.bActions}>
                    <Button label="Cancel" variant="outline" onPress={() => onCancel(b.id)} style={{ flex: 1 }} />
                  </View>
                ) : tab === 'past' ? (
                  <View style={styles.bActions}>
                    <Button label="🔄 Rebook" onPress={() => router.push('/')} style={{ flex: 1 }} />
                  </View>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  tabsWrap: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: spacing.lg,
    marginVertical: 14,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: colors.card2 },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.text3, fontFamily: fonts.body },
  tabTextActive: { color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  bCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  bCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  bName: { fontWeight: '600', fontSize: 15, color: colors.text, fontFamily: fonts.body },
  bSub: { fontSize: 12, color: colors.text2, marginTop: 2, fontFamily: fonts.body },
  bDate: { fontSize: 12, color: colors.text2, marginTop: 2, fontFamily: fonts.body },
  bActions: { flexDirection: 'row', gap: 8 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  empty: { alignItems: 'center' },
  emptyIcon: { fontSize: 44, marginBottom: 12, opacity: 0.4 },
  emptyTitle: { fontWeight: '600', color: colors.text2, fontSize: 14, fontFamily: fonts.body },
  emptySub: { color: colors.text3, fontSize: 14, marginTop: 4, fontFamily: fonts.body },
});
