import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useBookingStore } from '../lib/store';
import Avatar from '../components/Avatar';
import ScoreBar from '../components/ScoreBar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import TipCard from '../components/TipCard';
import type { ProviderScore } from '../api/client';
import { confirmBooking } from '../api/client';

function ProviderCard({
  name,
  rating,
  distanceKm,
  price,
  verified,
  top,
  breakdown,
  badge,
  onPress,
}: {
  name: string;
  rating: number;
  distanceKm: number;
  price: string;
  verified?: boolean;
  top?: boolean;
  badge?: string;
  breakdown?: { distance_score?: number; rating_score?: number; availability_score?: number };
  onPress?: () => void;
}) {
  const dist = breakdown?.distance_score ?? 0.32;
  const rat = breakdown?.rating_score ?? 0.25;
  const avail = breakdown?.availability_score ?? 0.43;
  return (
    <Pressable style={[styles.pcard, top && styles.pcardTop]} onPress={onPress} disabled={!onPress}>
      {top ? <View style={styles.topTag}><Text style={styles.topTagText}>⭐ Top Match</Text></View> : null}
      <View style={styles.pcardTopRow}>
        <Avatar name={name} size={top ? 52 : 48} square />
        <View style={styles.pinfo}>
          <Text style={styles.pname}>{name}</Text>
          <Text style={styles.pmeta}>
            <Text style={styles.star}>★ </Text>
            <Text style={styles.pmetaBold}>{rating.toFixed(1)}</Text>
            {' · '}{distanceKm.toFixed(1)} km · {price}
          </Text>
        </View>
        {verified ? <Badge label="✓ Verified" variant="jade" /> : badge ? <Badge label={badge} variant="amber" /> : null}
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
        <ActivityIndicator color={colors.violet} style={{ marginTop: spacing.xl }} />
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
        distance_score: p.score_breakdown?.distance_40pct ?? 0.28,
        rating_score: p.score_breakdown?.rating_35pct ?? 0.31,
        availability_score: p.score_breakdown?.availability_25pct ?? 0.35,
        total_score: p.score ?? 0,
      })) ?? []);

  const price =
    top.price_min_pkr && top.price_max_pkr
      ? `PKR ${top.price_min_pkr.toLocaleString()}`
      : 'Quote on visit';

  const topBreakdown = {
    distance_score: top.score_breakdown?.distance_40pct ?? 0.32,
    rating_score: top.score_breakdown?.rating_35pct ?? 0.25,
    availability_score: top.score_breakdown?.availability_25pct ?? 0.43,
  };

  const bookNow = async () => {
    if (booking) return;
    setBooking(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (result.booking?.booking_id) await confirmBooking(result.booking.booking_id);
      router.push('/booking-confirm');
    } finally {
      setBooking(false);
    }
  };

  const serviceTitle = `${result.intent.service_label} · ${result.intent.location}`;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.pageHeader}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.pageTitle} numberOfLines={1}>
            {serviceTitle}
          </Text>
          <Badge label={`${1 + alts.length} Found`} variant="violet" />
        </View>
        <Text style={styles.sub}>AI matched by location, rating & availability</Text>

        <View style={styles.tipWrap}>
          <TipCard
            tipId="results_pick"
            title="How to choose"
            message="⭐ Top Match is AI’s best pick. Tap a card for full profile. Use Book on the top provider to confirm."
          />
        </View>

        <View style={styles.topWrap}>
          <ProviderCard
            name={top.name}
            rating={top.rating}
            distanceKm={top.distance_km}
            price={price}
            verified={top.verified !== false}
            top
            breakdown={topBreakdown}
            onPress={() => router.push(`/provider/${top.id}`)}
          />
        </View>

        {alts.map((a, i) => (
          <View key={a.provider_id} style={styles.altWrap}>
            <ProviderCard
              name={a.name}
              rating={top.rating}
              distanceKm={top.distance_km}
              price={price}
              badge={i === 0 ? 'Popular' : 'Budget'}
              breakdown={{
                distance_score: a.distance_score,
                rating_score: a.rating_score,
                availability_score: a.availability_score,
              }}
              onPress={() => router.push(`/provider/${a.provider_id}`)}
            />
          </View>
        ))}

        <View style={styles.footer}>
          <Button
            label={`Book ${top.name} →`}
            onPress={bookNow}
            loading={booking}
            style={{ width: '100%' }}
          />
          <Link href="/(tabs)/trace" asChild>
            <Pressable style={styles.traceLink}>
              <Text style={styles.traceText}>🧠 View Agent Reasoning</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xl },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: colors.text, fontSize: 18 },
  pageTitle: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  sub: {
    fontSize: 12,
    color: colors.text3,
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    fontFamily: fonts.body,
  },
  tipWrap: { paddingHorizontal: spacing.lg, marginTop: 8 },
  topWrap: { marginHorizontal: spacing.lg, marginTop: 4, marginBottom: 12 },
  altWrap: { marginHorizontal: spacing.lg, marginBottom: 12 },
  pcard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  pcardTop: {
    borderColor: 'rgba(123,94,167,0.35)',
    backgroundColor: 'rgba(123,94,167,0.08)',
    marginTop: 10,
  },
  topTag: {
    position: 'absolute',
    top: -10,
    left: 14,
    zIndex: 2,
    backgroundColor: colors.violet,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
  },
  topTagText: { color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: fonts.body },
  pcardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  pinfo: { flex: 1 },
  pname: { fontWeight: '600', fontSize: 15, color: colors.text, fontFamily: fonts.body },
  pmeta: { fontSize: 12, color: colors.text2, marginTop: 3, fontFamily: fonts.body },
  star: { color: colors.amber },
  pmetaBold: { color: colors.text, fontWeight: '600' },
  footer: { paddingHorizontal: spacing.lg, marginTop: 8 },
  traceLink: { marginTop: 10, alignItems: 'center', padding: spacing.sm },
  traceText: { color: colors.text2, fontWeight: '600', fontFamily: fonts.body },
});
