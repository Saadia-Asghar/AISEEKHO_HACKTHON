import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { colors, radius, spacing } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import { api, getProvider } from '../../api/client';
import { getSession } from '../../lib/auth';

export default function ProviderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      try {
        const p = await getProvider(id!, session?.userId);
        const { data: revData } = await api.get<{ reviews: Array<{ rating: number; comment?: string }> }>(
          `/api/providers/${id}/reviews`
        );
        setData({ ...(p as object), reviews: revData.reviews });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  const name = String(data?.name || 'Provider');
  const reviews = (data?.reviews as Array<{ rating: number; stars?: number; comment?: string }>) || [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Avatar name={name} size={80} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>
            ⭐ {Number(data?.rating || 0).toFixed(1)} · 📍 {String(data?.area || 'Islamabad')}
          </Text>
          {data?.phone ? <Text style={styles.muted}>📞 {String(data.phone)}</Text> : null}
        </View>

        <Text style={styles.section}>Reviews</Text>
        {reviews.length === 0 ? (
          <Text style={styles.muted}>No reviews yet</Text>
        ) : (
          reviews.map((r, i) => (
            <View key={i} style={styles.review}>
              <Text style={styles.stars}>{'⭐'.repeat(r.rating ?? r.stars ?? 5)}</Text>
              {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md },
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  name: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: spacing.md },
  meta: { color: colors.muted, marginTop: spacing.sm },
  muted: { color: colors.muted, marginTop: spacing.xs },
  section: { color: colors.text, fontWeight: '700', marginBottom: spacing.sm },
  review: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  stars: { color: colors.text },
  comment: { color: colors.muted, marginTop: 4 },
});
