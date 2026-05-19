import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, shadows, spacing } from '../constants/theme';
import { useBookingStore } from '../lib/store';
import Avatar from '../components/Avatar';
import ScoreBar from '../components/ScoreBar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import TipCard from '../components/TipCard';
import BookingFlowBar from '../components/BookingFlowBar';
import PageHeader from '../components/PageHeader';
import CurvedSheet from '../components/ui/CurvedSheet';
import NearbyMap from '../components/NearbyMap';
import PriceSortChips from '../components/PriceSortChips';
import SecLabel from '../components/ui/SecLabel';
import { showToast } from '../lib/toastStore';
import type { ProviderSummary, PriceSort } from '../api/client';
import { confirmBooking, createBookingFromDiscover, discover } from '../api/client';
import TransparentPricing from '../components/TransparentPricing';
import { getSession } from '../lib/auth';
import { getUserCoords } from '../lib/location';
import { setPriceSort as persistPriceSort } from '../lib/bookingPrefs';
import { useI18n } from '../lib/i18n';

function formatPrice(p: ProviderSummary) {
  if (p.price_min_pkr && p.price_max_pkr) {
    return `PKR ${p.price_min_pkr.toLocaleString()}–${p.price_max_pkr.toLocaleString()}`;
  }
  if (p.price_min_pkr) return `from PKR ${p.price_min_pkr.toLocaleString()}`;
  return 'Quote on visit';
}

function ProviderCard({
  provider,
  top,
  topRated,
  badge,
  onPress,
}: {
  provider: ProviderSummary;
  top?: boolean;
  topRated?: boolean;
  badge?: string;
  onPress?: () => void;
}) {
  const bd = provider.score_breakdown;
  const dist = bd?.distance_40pct ?? 0.32;
  const rat = bd?.rating_35pct ?? 0.25;
  const avail = bd?.availability_25pct ?? 0.43;

  return (
    <Pressable style={[styles.pcard, top && styles.pcardTop]} onPress={onPress} disabled={!onPress}>
      {top ? (
        <View style={styles.topTag}>
          <Text style={styles.topTagText}>⭐ Top Match</Text>
        </View>
      ) : null}
      {topRated && !top ? (
        <View style={[styles.topTag, styles.topRatedTag]}>
          <Text style={styles.topTagText}>🏆 Top Rated</Text>
        </View>
      ) : null}
      <View style={styles.pcardTopRow}>
        <Avatar name={provider.name} size={top ? 52 : 48} square />
        <View style={styles.pinfo}>
          <Text style={styles.pname}>{provider.name}</Text>
          <Text style={styles.pmeta}>
            <Text style={styles.star}>★ </Text>
            <Text style={styles.pmetaBold}>{provider.rating.toFixed(1)}</Text>
            {' · '}
            {provider.distance_km.toFixed(1)} km · {formatPrice(provider)}
          </Text>
        </View>
        <View style={styles.badgesCol}>
          {provider.verified ? <Badge label="✓ Verified" variant="jade" /> : null}
          {provider.contacted_before ? <Badge label="Contacted" variant="violet" /> : null}
          {badge ? <Badge label={badge} variant="amber" /> : null}
        </View>
      </View>
      {bd ? <ScoreBar distance={dist} rating={rat} availability={avail} /> : null}
    </Pressable>
  );
}

export default function ResultsScreen() {
  const { result, priceSort, setPriceSort, setResult, lastSearchText } = useBookingStore();
  const { t, lang } = useI18n();
  const [booking, setBooking] = useState(false);
  const [resorting, setResorting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!result) router.replace('/');
  }, [result]);

  const reSearch = useCallback(
    async (sort: PriceSort) => {
      if (!lastSearchText || resorting) return;
      setResorting(true);
      setPriceSort(sort);
      await persistPriceSort(sort);
      try {
        const session = await getSession();
        if (!session) {
          router.replace('/auth');
          return;
        }
        const coords = await getUserCoords();
        const data = await discover(lastSearchText, session.userId, session.name, session.phone, {
          userLat: coords.lat,
          userLng: coords.lng,
          priceSort: sort,
          lang,
        });
        setResult(data);
        showToast(sort === 'smart' ? 'Sorted by best match' : sort === 'low' ? 'Lowest price first' : 'Premium first');
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Could not re-sort');
      } finally {
        setResorting(false);
      }
    },
    [lastSearchText, resorting, setPriceSort, setResult, lang]
  );

  useEffect(() => {
    if (result?.recommended?.id) setSelectedId(result.recommended.id);
  }, [result?.recommended?.id]);

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.violet} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  const top = result.recommended;
  const topRated = (result.top_rated ?? []).filter((p) => p.id !== top.id);
  const candidates = result.candidates ?? result.top_three ?? [];
  const others = candidates.filter(
    (p) => p.id !== top.id && !topRated.some((t) => t.id === p.id)
  );

  const sortLabel =
    result.price_sort === 'low' ? 'Lowest price' : result.price_sort === 'high' ? 'Premium' : 'Best match';

  const bookNow = async () => {
    if (booking || !selectedId) return;
    setBooking(true);
    try {
      const session = await getSession();
      if (!session) {
        router.replace('/auth');
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      let full = result;
      if (!result.booking?.booking_id) {
        full = await createBookingFromDiscover(
          result.session_id,
          selectedId,
          session.userId,
          session.name,
          session.phone
        );
        setResult(full);
      }
      if (full.booking?.booking_id) await confirmBooking(full.booking.booking_id);
      showToast('✓ Booking confirmed!');
      router.push('/booking-confirm');
    } finally {
      setBooking(false);
    }
  };

  const serviceTitle = `${result.intent.service_label} · ${result.intent.location}`;
  const markerCount = result.map_markers?.length ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <PageHeader
        title={serviceTitle}
        subtitle={`${sortLabel} · ${markerCount || candidates.length} nearby`}
        onBack={() => router.back()}
        right={<Badge label={`${candidates.length} Found`} variant="violet" />}
      />
      <CurvedSheet style={styles.sheet}>
        <BookingFlowBar step={1} />
        {resorting ? (
          <ActivityIndicator color={colors.violet} style={{ marginVertical: spacing.md }} />
        ) : null}
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.preview}>{t('preview_note')}</Text>
          <TransparentPricing pricing={result.pricing} />
          <View style={styles.sortPad}>
            <PriceSortChips value={priceSort} onChange={reSearch} />
          </View>

          {result.map_markers && result.map_markers.length > 0 ? (
            <NearbyMap
              markers={result.map_markers}
              userLat={result.user_location?.lat}
              userLng={result.user_location?.lng}
              onMarkerPress={(id) => router.push(`/provider/${id}`)}
            />
          ) : null}

          <View style={styles.tipWrap}>
            <TipCard
              tipId="results_pick"
              title="How to choose"
              message="🏆 Top rated workers appear first. Use charge sort for budget or premium. Tap map pins or cards for profiles."
            />
          </View>

          {topRated.length > 0 ? (
            <View style={styles.block}>
              <SecLabel>{t('top_rated')}</SecLabel>
              {topRated.map((p) => (
                <View key={p.id} style={styles.cardWrap}>
                  <ProviderCard
                    provider={p}
                    topRated
                    onPress={() => router.push(`/provider/${p.id}`)}
                  />
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.block}>
            <SecLabel>{t('top_match')}</SecLabel>
            <View style={styles.cardWrap}>
              <ProviderCard
                provider={top}
                top
                onPress={() => {
                  setSelectedId(top.id);
                  router.push(`/provider/${top.id}`);
                }}
              />
            </View>
          </View>

          {others.length > 0 ? (
            <View style={styles.block}>
              <SecLabel>{t('more_nearby')}</SecLabel>
              {others.map((p, i) => (
                <View key={p.id} style={styles.cardWrap}>
                  <ProviderCard
                    provider={p}
                    badge={i === 0 ? 'Nearby' : undefined}
                    onPress={() => {
                      setSelectedId(p.id);
                      router.push(`/provider/${p.id}`);
                    }}
                  />
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.footer}>
            <Button
              label={`${t('confirm_book')}: ${candidates.find((p) => p.id === selectedId)?.name ?? top.name} →`}
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
      </CurvedSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.violetDeep },
  sheet: { flex: 1, marginTop: -20 },
  scroll: { paddingBottom: spacing.xl, paddingTop: spacing.sm },
  preview: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.amber,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    fontFamily: fonts.body,
  },
  sortPad: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  tipWrap: { paddingHorizontal: spacing.lg, marginTop: 4 },
  block: { marginTop: spacing.md },
  cardWrap: { marginHorizontal: spacing.lg, marginBottom: 12 },
  pcard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.card,
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
  topRatedTag: { backgroundColor: colors.amber, left: 'auto', right: 14 },
  topTagText: { color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: fonts.body },
  pcardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  pinfo: { flex: 1 },
  badgesCol: { alignItems: 'flex-end', gap: 4 },
  pname: { fontWeight: '600', fontSize: 15, color: colors.text, fontFamily: fonts.body },
  pmeta: { fontSize: 12, color: colors.text2, marginTop: 3, fontFamily: fonts.body },
  star: { color: colors.amber },
  pmetaBold: { color: colors.text, fontWeight: '600' },
  footer: { paddingHorizontal: spacing.lg, marginTop: 8 },
  traceLink: { marginTop: 10, alignItems: 'center', padding: spacing.sm },
  traceText: { color: colors.text2, fontWeight: '600', fontFamily: fonts.body },
});
