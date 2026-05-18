import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../constants/theme';
import { useBookingStore } from '../lib/store';
import Avatar from '../components/Avatar';
import ScoreBar from '../components/ScoreBar';
import type { ProviderScore } from '../api/client';
import { confirmBooking } from '../api/client';

function ProviderCard({
  name,
  rating,
  distanceKm,
  price,
  verified,
  muted,
  breakdown,
  onPress,
}: {
  name: string;
  rating: number;
  distanceKm: number;
  price: string;
  verified?: boolean;
  muted?: boolean;
  breakdown?: { distance_score?: number; rating_score?: number; availability_score?: number };
  onPress?: () => void;
}) {
  const dist = breakdown?.distance_score ?? 0.4;
  const rat = breakdown?.rating_score ?? 0.35;
  const avail = breakdown?.availability_score ?? 0.25;
  return (
    <Pressable
      style={[styles.card, muted && styles.cardMuted]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.cardRow}>
        <Avatar name={name} size={muted ? 40 : 56} />
        <View style={styles.cardBody}>
          <Text style={[styles.name, muted && { fontSize: 16 }]}>{name}</Text>
          <Text style={styles.meta}>
            ⭐ {rating.toFixed(1)} · 📍 {distanceKm.toFixed(1)} km · 💰 {price}
          </Text>
          {verified ? <Text style={styles.verified}>✓ Verified</Text> : null}
        </View>
      </View>
      <ScoreBar distance={dist} rating={rat} availability={avail} />
    </Pressable>
  );
}

export default function ResultsScreen() {
  const { result } = useBookingStore();
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!result) router.replace('/');
  }, [result]);

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.skeletons}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skel} />
          ))}
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const top = result.recommended;
  const alts: ProviderScore[] = result.alternatives?.length
    ? result.alternatives
    : (result.top_three?.slice(1, 3).map((p) => ({
        name: p.name,
        provider_id: p.id,
        score: p.score ?? 0,
        distance_score: p.score_breakdown?.distance_40pct ?? 0.4,
        rating_score: p.score_breakdown?.rating_35pct ?? 0.35,
        availability_score: p.score_breakdown?.availability_25pct ?? 0.25,
        total_score: p.score ?? 0,
      })) ?? []);

  const price =
    top.price_min_pkr && top.price_max_pkr
      ? `${top.price_min_pkr}–${top.price_max_pkr} PKR`
      : 'Quote on visit';

  const topBreakdown = {
    distance_score: top.score_breakdown?.distance_40pct ?? 0.4,
    rating_score: top.score_breakdown?.rating_35pct ?? 0.35,
    availability_score: top.score_breakdown?.availability_25pct ?? 0.25,
  };

  const bookNow = async () => {
    if (booking) return;
    setBooking(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (result.booking?.booking_id) {
        await confirmBooking(result.booking.booking_id);
      }
      router.push('/booking-confirm');
    } finally {
      setBooking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Top match</Text>
        <ProviderCard
          name={top.name}
          rating={top.rating}
          distanceKm={top.distance_km}
          price={price}
          verified={top.verified !== false}
          breakdown={topBreakdown}
        />

        {alts.length > 0 ? (
          <>
            <Text style={[styles.heading, { marginTop: spacing.lg }]}>Alternatives</Text>
            {alts.map((a) => (
              <ProviderCard
                key={a.provider_id}
                name={a.name}
                rating={top.rating}
                distanceKm={top.distance_km}
                price={price}
                muted
                breakdown={{
                  distance_score: a.distance_score,
                  rating_score: a.rating_score,
                  availability_score: a.availability_score,
                }}
                onPress={() => router.push(`/provider/${a.provider_id}`)}
              />
            ))}
          </>
        ) : null}

        <Pressable
          style={[styles.cta, booking && { opacity: 0.5 }]}
          onPress={bookNow}
          disabled={booking}
        >
          <Text style={styles.ctaText}>{booking ? 'Booking…' : 'Book Now'}</Text>
        </Pressable>

        <Link href="/(tabs)/trace" asChild>
          <Pressable style={styles.traceBtn}>
            <Text style={styles.traceText}>View Agent Reasoning</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  heading: { color: colors.muted, fontSize: 13, fontWeight: '600', marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  cardMuted: { borderColor: colors.border, opacity: 0.92, marginTop: spacing.sm },
  cardRow: { flexDirection: 'row', gap: spacing.md },
  cardBody: { flex: 1 },
  name: { color: colors.text, fontSize: 20, fontWeight: '800' },
  meta: { color: colors.muted, marginTop: 4, fontSize: 13 },
  verified: { color: colors.success, marginTop: 4, fontSize: 12, fontWeight: '600' },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  ctaText: { color: colors.text, fontWeight: '800', fontSize: 17 },
  traceBtn: { marginTop: spacing.md, alignItems: 'center', padding: spacing.sm },
  traceText: { color: colors.accent, fontWeight: '600' },
  skeletons: { padding: spacing.md, gap: spacing.md },
  skel: {
    height: 120,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    opacity: 0.6,
  },
});
