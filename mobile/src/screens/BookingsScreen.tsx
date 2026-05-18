import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import HapticPressable from '../components/HapticPressable';
import { fetchBookings, cancelBooking } from '../api/api';
import { useTheme } from '../hooks/useTheme';
import { useUserStore } from '../store/useUserStore';
import { useAppStore } from '../store/useAppStore';
import { SkeletonList } from '../components/Skeleton';
import { useNavigation } from '@react-navigation/native';

type Tab = 'upcoming' | 'past' | 'cancelled';

export default function BookingsScreen() {
  const { colors } = useTheme();
  const { userId, displayName, phone } = useUserStore();
  const setResult = useAppStore((s) => s.setResult);
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [list, setList] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await fetchBookings(userId, tab);
      setList(data.bookings);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [userId, tab]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onCancel = (bookingId: string) => {
    Alert.alert('Cancel booking?', bookingId, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          if (!userId) return;
          await cancelBooking(bookingId, userId);
          load();
        },
      },
    ]);
  };

  const onRebook = async (b: Record<string, unknown>) => {
    const msg = `Mujhe ${b.service_type} chahiye ${b.location} mein`;
    useAppStore.getState().setPendingMessage(msg);
    navigation.navigate('BookTab', { screen: 'Home' });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.tabs}>
        {(['upcoming', 'past', 'cancelled'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab(t)}
          >
            <Text style={{ color: tab === t ? colors.primary : colors.muted, fontWeight: '600' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <SkeletonList count={4} />
        ) : list.length === 0 ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>No {tab} bookings.</Text>
        ) : (
          list.map((b) => (
            <View key={b.booking_id as string} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{b.provider_name as string}</Text>
              <Text style={{ color: colors.muted }}>
                {b.booking_id as string} · {b.slot as string} · {b.status as string}
              </Text>
              <View style={styles.row}>
                {tab === 'upcoming' ? (
                  <Pressable onPress={() => onCancel(b.booking_id as string)}>
                    <Text style={{ color: colors.error }}>Cancel</Text>
                  </Pressable>
                ) : null}
                {tab === 'past' ? (
                  <Pressable onPress={() => onRebook(b)}>
                    <Text style={{ color: colors.primary }}>Rebook</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { flexDirection: 'row', paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  content: { padding: 16, paddingBottom: 32 },
  card: { padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  row: { flexDirection: 'row', gap: 16, marginTop: 10 },
});
