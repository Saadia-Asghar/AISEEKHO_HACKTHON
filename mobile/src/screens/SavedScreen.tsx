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
import { fetchSaved, SavedProvider, unsaveProvider } from '../api/client';
import { useUserStore } from '../store/useUserStore';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../constants/theme';
import type { MainTabParamList } from '../navigation/MainTabNavigator';
import type { HomeStackParamList } from '../navigation/HomeStackNavigator';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'SavedTab'>,
  NativeStackNavigationProp<HomeStackParamList>
>;

const SERVICE_PHRASES: Record<string, string> = {
  ac_technician: 'AC technician',
  plumber: 'plumber',
  electrician: 'electrician',
  tutor: 'home tutor',
  beautician: 'beautician',
  carpenter: 'carpenter',
  painter: 'painter',
  general: 'service',
};

export default function SavedScreen() {
  const userId = useUserStore((s) => s.userId)!;
  const navigation = useNavigation<Nav>();
  const setPendingMessage = useAppStore((s) => s.setPendingMessage);
  const [saved, setSaved] = useState<SavedProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSaved(await fetchSaved(userId));
    } catch {
      setSaved([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRebook = (p: SavedProvider) => {
    const service = SERVICE_PHRASES[p.category] || p.category;
    const msg = `Mujhe kal subah ${p.area} mein ${service} chahiye`;
    setPendingMessage(msg);
    navigation.navigate('BookTab', { screen: 'Home' });
  };

  const onRemove = async (providerId: string) => {
    await unsaveProvider(userId, providerId);
    load();
  };

  if (loading && saved.length === 0) {
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
      <Text style={styles.hint}>Workers you saved get a boost in future AI recommendations.</Text>

      {saved.length === 0 ? (
        <Text style={styles.empty}>No saved workers yet. Rate a booking and check “Save to favorites”.</Text>
      ) : (
        saved.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.meta}>
              {p.area} · ★{p.rating} · {p.phone}
            </Text>
            {p.your_rating ? <Text style={styles.your}>You rated: {p.your_rating}★</Text> : null}
            <View style={styles.row}>
              <Pressable style={styles.primaryBtn} onPress={() => onRebook(p)}>
                <Text style={styles.primaryText}>Book again</Text>
              </Pressable>
              <Pressable style={styles.ghostBtn} onPress={() => onRemove(p.id)}>
                <Text style={styles.ghostText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  hint: { color: colors.muted, marginBottom: 16, lineHeight: 20 },
  empty: { color: colors.dim, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  meta: { color: colors.muted, marginTop: 6 },
  your: { color: colors.primary, marginTop: 6, fontSize: 13 },
  row: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: colors.bg, fontWeight: '700' },
  ghostBtn: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostText: { color: colors.muted },
});
