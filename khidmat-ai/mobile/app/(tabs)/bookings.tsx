import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { AppColors } from '../../constants/theme';
import { fonts, spacing } from '../../constants/theme';
import { router } from 'expo-router';
import { getSession } from '../../lib/auth';
import { cancelBooking, getBookings, rescheduleBooking } from '../../api/client';
import RescheduleModal from '../../components/RescheduleModal';
import { scheduleLocalNotification } from '../../lib/appNotifications';
import { bookingRowId } from '../../lib/store';
import { useI18n } from '../../lib/i18n';
import { useTheme } from '../../lib/ThemeContext';
import { showToast } from '../../lib/toastStore';
import Avatar from '../../components/Avatar';
import Button from '../../components/ui/Button';
import ScreenGuide from '../../components/ScreenGuide';
import EmptyState from '../../components/EmptyState';
import StitchFilterPills from '../../components/stitch/StitchFilterPills';
import StitchGlassCard from '../../components/stitch/StitchGlassCard';
import GoogleBadge from '../../components/GoogleBadge';
import ThemedSafeArea from '../../components/ThemedSafeArea';

import type { strings } from '../../constants/i18n';

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

function statusLabel(status: string | undefined, t: (k: keyof (typeof strings)['en']) => string) {
  const s = (status || 'PENDING').toUpperCase();
  if (s === 'IN_PROGRESS') return t('status_in_progress');
  if (s === 'CONFIRMED') return t('status_confirmed');
  if (s === 'COMPLETED') return t('status_completed');
  if (s === 'CANCELLED') return t('status_cancelled');
  return t('status_pending');
}

function statusColor(c: AppColors, status: string | undefined) {
  const s = (status || '').toUpperCase();
  if (s.includes('CANCEL')) return c.rose;
  if (s === 'COMPLETED') return c.text2;
  return c.jade;
}

export default function BookingsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => bookingsStyles(colors), [colors]);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingRow | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

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

  const onReschedule = async (slot: string, when: 'today' | 'tomorrow') => {
    if (!rescheduleTarget) return;
    const bid = bookingRowId(rescheduleTarget);
    const session = await getSession();
    if (!session) return;
    setRescheduling(true);
    try {
      await rescheduleBooking(bid, session.userId, slot, when);
      setRescheduleTarget(null);
      showToast(t('reschedule_done'));
      scheduleLocalNotification(
        'Visit rescheduled',
        `${rescheduleTarget.provider_name} · ${when} ${slot}`,
        Platform.OS === 'web' ? 15 : 3600,
        'reminder'
      );
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('reschedule_failed'));
    } finally {
      setRescheduling(false);
    }
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

  return (
    <ThemedSafeArea edges={['top']}>
      <ScreenGuide title={t('bookings_title')} subtitle={t('bookings_sub')} />
      <StitchFilterPills
        options={[
          { key: 'upcoming' as Tab, label: t('tab_upcoming') },
          { key: 'past' as Tab, label: t('tab_past') },
          { key: 'cancelled' as Tab, label: t('tab_cancelled') },
        ]}
        value={tab}
        onChange={(next) => {
          setTab(next);
          setLoading(true);
        }}
      />

      {loading ? (
        <ActivityIndicator color={colors.violet} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.violet}
            />
          }
          contentContainerStyle={rows.length ? styles.list : styles.emptyWrap}
        >
          {rows.length === 0 ? (
            <EmptyState
              icon={tab === 'cancelled' ? '🎉' : '📋'}
              title={tab === 'cancelled' ? t('no_cancelled') : t('no_bookings')}
              message={tab === 'cancelled' ? t('no_cancelled') : t('steps_home')}
              actionLabel={tab !== 'cancelled' ? t('book_from_home') : undefined}
              onAction={tab !== 'cancelled' ? () => router.push('/') : undefined}
            />
          ) : (
            rows.map((b) => {
              const bid = bookingRowId(b);
              return (
                <StitchGlassCard key={bid} style={styles.bCard}>
                  <View style={styles.bCardTop}>
                    <Avatar name={b.provider_name || 'P'} size={52} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bName}>{b.service_type || 'Service'}</Text>
                      <Text style={styles.bSub}>with {b.provider_name || 'Provider'}</Text>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>DATE & TIME</Text>
                      <Text style={styles.metaVal}>{b.slot || b.slot_datetime || '—'}</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>STATUS</Text>
                      <View style={styles.statusRow}>
                        <View
                          style={[styles.statusDot, { backgroundColor: statusColor(colors, b.status) }]}
                        />
                        <Text style={[styles.statusText, { color: statusColor(colors, b.status) }]}>
                          {statusLabel(b.status, t)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {tab === 'upcoming' ? (
                    <View style={styles.bActions}>
                      <Button
                        label={t('reschedule')}
                        variant="outline"
                        onPress={() => setRescheduleTarget(b)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        label={t('cancel_booking')}
                        onPress={() => onCancel(bid)}
                        style={{ flex: 1 }}
                      />
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
                </StitchGlassCard>
              );
            })
          )}
          <GoogleBadge />
        </ScrollView>
      )}

      <RescheduleModal
        visible={!!rescheduleTarget}
        currentSlot={rescheduleTarget?.slot}
        providerName={rescheduleTarget?.provider_name}
        onClose={() => !rescheduling && setRescheduleTarget(null)}
        onConfirm={onReschedule}
        loading={rescheduling}
      />
    </ThemedSafeArea>
  );
}

function bookingsStyles(colors: AppColors) {
  return StyleSheet.create({
    list: { paddingHorizontal: spacing.lg, paddingBottom: 110, paddingTop: spacing.md, gap: spacing.md },
    bCard: { padding: spacing.md },
    bCardTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.md },
    bName: { fontWeight: '700', fontSize: 16, color: colors.text, fontFamily: fonts.display },
    bSub: { fontSize: 13, color: colors.text2, marginTop: 4, fontFamily: fonts.body },
    metaRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    metaCol: { flex: 1 },
    metaLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: colors.text3,
      marginBottom: 4,
      fontFamily: fonts.body,
    },
    metaVal: { fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: fonts.body },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 14, fontWeight: '600', fontFamily: fonts.body },
    bActions: { flexDirection: 'row', gap: 8 },
    emptyWrap: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  });
}
