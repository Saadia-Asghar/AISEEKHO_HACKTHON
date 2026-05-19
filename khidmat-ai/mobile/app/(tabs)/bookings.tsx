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
import { bookingRowId } from '../../lib/store';
import { useI18n } from '../../lib/i18n';
import { showToast } from '../../lib/toastStore';
import Avatar from '../../components/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ScreenGuide from '../../components/ScreenGuide';
import EmptyState from '../../components/EmptyState';
import SegmentedControl from '../../components/ui/SegmentedControl';
import StitchGlassCard from '../../components/stitch/StitchGlassCard';

type Tab = 'upcoming' | 'past' | 'cancelled';

type BookingRow = {
  booking_id?: string;
  id?: string;
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
      <ScreenGuide title={t('bookings_title')} subtitle={t('bookings_sub')} />
      <View style={styles.sheetInner}>
        <StitchGlassCard style={styles.filterCard}>
          <SegmentedControl
            options={[
              { key: 'upcoming' as Tab, label: t('tab_upcoming') },
              { key: 'past' as Tab, label: t('tab_past') },
              { key: 'cancelled' as Tab, label: t('tab_cancelled') },
            ]}
            value={tab}
            onChange={(t) => {
              setTab(t);
              setLoading(true);
            }}
          />
        </StitchGlassCard>
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
              title={tab === 'cancelled' ? t('no_cancelled') : t('no_bookings')}
              message={
                tab === 'cancelled'
                  ? t('no_cancelled')
                  : t('steps_home')
              }
              actionLabel={tab !== 'cancelled' ? t('book_from_home') : undefined}
              onAction={tab !== 'cancelled' ? () => router.push('/') : undefined}
            />
          ) : (
            rows.map((b) => {
              const bid = bookingRowId(b);
              return (
              <View key={bid} style={styles.bCard}>
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
                        await startBooking(bid);
                        showToast(t('status_in_progress'));
                        load();
                      }}
                      style={{ flex: 1 }}
                    />
                    <Button label={t('cancel_booking')} variant="outline" onPress={() => onCancel(bid)} style={{ flex: 1 }} />
                  </View>
                ) : tab === 'past' ? (
                  <View style={styles.bActions}>
                    <Button
                      label={`🔄 ${t('rebook')}`}
                      onPress={() => {
                        const msg = `Mujhe ${b.service_type || 'service'} chahiye ${b.location || 'G-13'} mein — prefer ${b.provider_name}`;
                        router.push({ pathname: '/', params: { q: msg, submit: '1' } });
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
  sheetInner: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.sm },
  filterCard: { padding: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 110, paddingTop: spacing.sm },
  bCard: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
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
