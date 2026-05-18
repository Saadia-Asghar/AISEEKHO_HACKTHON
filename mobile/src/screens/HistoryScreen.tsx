import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookingHistoryItem, fetchBookings } from '../api/client';
import { useUserStore } from '../store/useUserStore';
import { colors } from '../constants/theme';
import type { MainTabParamList } from '../navigation/MainTabNavigator';
import type { HomeStackParamList } from '../navigation/HomeStackNavigator';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HistoryTab'>,
  NativeStackNavigationProp<HomeStackParamList>
>;

export default function HistoryScreen() {
  const userId = useUserStore((s) => s.userId)!;
  const navigation = useNavigation<Nav>();
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBookings(await fetchBookings(userId));
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading && bookings.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
    >
      {bookings.length === 0 ? (
        <Text style={styles.empty}>No bookings yet. Make your first request from the Book tab.</Text>
      ) : (
        bookings.map((b) => (
          <View key={b.booking_id} style={styles.card}>
            <Text style={styles.id}>{b.booking_id}</Text>
            <Text style={styles.name}>{b.provider_name}</Text>
            <Text style={styles.meta}>
              {b.service_type} · {b.location} · {b.slot}
            </Text>
            <Text style={styles.status}>{b.status}</Text>
            {b.rated ? (
              <Text style={styles.rated}>Rated {b.user_stars}★</Text>
            ) : (
              <Pressable
                style={styles.rateBtn}
                onPress={() => navigation.navigate('BookTab', { screen: 'Home' })}
              >
                <Text style={styles.rateText}>Complete booking on Book tab to rate</Text>
              </Pressable>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  empty: { color: colors.dim, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  id: { color: colors.dim, fontSize: 11, fontFamily: 'monospace' },
  name: { color: colors.text, fontWeight: '700', fontSize: 16, marginTop: 4 },
  meta: { color: colors.muted, marginTop: 4 },
  status: { color: colors.primary, marginTop: 6, fontSize: 12 },
  rated: { color: colors.success, marginTop: 8 },
  rateBtn: { marginTop: 8 },
  rateText: { color: colors.dim, fontSize: 12 },
});
