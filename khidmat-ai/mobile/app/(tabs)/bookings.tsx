import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { getSession } from '../../lib/auth';
import { cancelBooking, getBookings, startBooking } from '../../api/client';
import { useI18n } from '../../lib/i18n';
import { showToast } from '../../lib/toastStore';
import Avatar from '../../components/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ScreenGuide from '../../components/ScreenGuide';
import TipCard from '../../components/TipCard';
import EmptyState from '../../components/EmptyState';
import CurvedSheet from '../../components/ui/CurvedSheet';
import SegmentedControl from '../../components/ui/SegmentedControl';

type Tab = 'upcoming' | 'past' | 'cancelled';

type BookingRow = {
  id: string;
  service_type?: string;
  provider_name?: string;
  location?: string;
  slot?: string;
  slot_datetime?: string;
  status?: string;
};

import type { strings } from '../../constants/i18n';

function statusLabel(status: string | undefined, t: (k: keyof (typeof strings)['en']) => string) {
  const s = (status || 'PENDING').toUpperCase();
  if (s === 'IN_PROGRESS') return t('status_in_progress');
  if (s === 'CONFIRMED') return t('status_confirmed');
  if (s === 'COMPLETED') return t('status_completed');
  if (s === 'CANCELLED') return t('status_cancelled');
  return t('status_pending');
}

export default function BookingsScreen() {
  const { t } = useI18n();
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenGuide
        title="My Bookings"
        subtitle="Upcoming jobs, past history, and cancellations. Pull down to refresh."
      />
      <CurvedSheet style={styles.sheet}>
        <View style={styles.sheetInner}>
          <TipCard
            tipId="bookings_tabs"
            title="Tabs explained"
            message="Upcoming = active jobs · Past = completed · Cancelled = ended by you"
          />
          <SegmentedControl
            options={[
              { key: 'upcoming' as Tab, label: 'Upcoming' },
              { key: 'past' as Tab, label: 'Past' },
              { key: 'cancelled' as Tab, label: 'Cancelled' },
            ]}
            value={tab}
            onChange={(t) => {
              setTab(t);
              setLoading(true);
            }}
          />
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
                    label={statusLabel(b.status, t)}
                    variant={(b.status || '').includes('CANCEL') ? 'rose' : 'jade'}
                  />
                </View>
                {tab === 'upcoming' ? (
                  <View style={styles.bActions}>
                    <Button
                      label={t('on_the_way')}
                      variant="ghost"
                      onPress={async () => {
                        await startBooking(b.id);
                        showToast(t('status_in_progress'));
                        load();
                      }}
                      style={{ flex: 1 }}
                    />
                    <Button label="Cancel" variant="outline" onPress={() => onCancel(b.id)} style={{ flex: 1 }} />
                  </View>
                ) : tab === 'past' ? (
                  <View style={styles.bActions}>
                    <Button
                      label={`🔄 ${t('rebook')}`}
                      onPress={() => {
                        const msg = `Mujhe ${b.service_type || 'service'} chahiye ${b.location || 'G-13'} mein — prefer ${b.provider_name}`;
                        router.push({ pathname: '/', params: { q: msg } });
                      }}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label={t('share_worker')}
                      variant="outline"
                      onPress={() =>
                        Share.share({
                          message: `Book ${b.provider_name} on KhidmatAI — ${b.service_type} in ${b.location}`,
                        })
                      }
                      style={{ flex: 1 }}
                    />
                  </View>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      )}
      </CurvedSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.violetDeep },
  sheet: { flex: 1, marginTop: -20 },
  sheetInner: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 110, paddingTop: spacing.sm },
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
