import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { colors, fonts, radius, shadows, spacing } from '../constants/theme';
import { useBookingStore } from '../lib/store';
import Avatar from '../components/Avatar';
import ScoreBar from '../components/ScoreBar';
import Badge from '../components/ui/Badge';
import TipCard from '../components/TipCard';
import BookingFlowBar from '../components/BookingFlowBar';
import PageHeader from '../components/PageHeader';
import CurvedSheet from '../components/ui/CurvedSheet';
import NearbyMap from '../components/NearbyMap';
import PriceSortChips from '../components/PriceSortChips';
import SecLabel from '../components/ui/SecLabel';
import CheckoutBar from '../components/CheckoutBar';
import { showToast } from '../lib/toastStore';
import type { ProviderSummary, PriceSort } from '../api/client';
import { discover } from '../api/client';
import { goToCheckout, selectProvider } from '../lib/bookingFlow';
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
  selected,
  top,
  topRated,
  badge,
  onSelect,
  onProfile,
  t,
}: {
  provider: ProviderSummary;
  selected?: boolean;
  top?: boolean;
  topRated?: boolean;
  badge?: string;
  onSelect: () => void;
  onProfile: () => void;
  t: (k: string) => string;
}) {
  const bd = provider.score_breakdown;
  const dist = bd?.distance_40pct ?? 0.32;
  const rat = bd?.rating_35pct ?? 0.25;
  const avail = bd?.availability_25pct ?? 0.43;

  return (
    <Pressable
      style={[
        styles.pcard,
        top && styles.pcardTop,
        selected && styles.pcardSelected,
      ]}
      onPress={onSelect}
    >
      {selected ? (
        <View style={styles.selectedTag}>
          <Text style={styles.selectedTagText}>✓ {t('selected')}</Text>
        </View>
      ) : null}
      {top && !selected ? (
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
      <Pressable style={styles.profileLink} onPress={onProfile} hitSlop={8}>
        <Text style={styles.profileLinkText}>{t('view_profile')} →</Text>
      </Pressable>
    </Pressable>
  );
}

export default function ResultsScreen() {
  const {
    result,
    priceSort,
    setPriceSort,
    setResult,
    lastSearchText,
    searchFilters,
    selectedProviderId,
    setSelectedProviderId,
  } = useBookingStore();
  const { t, lang } = useI18n();
  const [resorting, setResorting] = useState(false);

  useEffect(() => {
    if (!result) router.replace('/');
  }, [result]);

  useEffect(() => {
    if (result?.recommended?.id && !selectedProviderId) {
      setSelectedProviderId(result.recommended.id);
    }
  }, [result?.recommended?.id, selectedProviderId, setSelectedProviderId]);

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
          maxDistanceKm: searchFilters.maxDistanceKm,
          minRating: searchFilters.minRating,
          verifiedOnly: searchFilters.verifiedOnly,
          availableToday: searchFilters.availableToday,
          lang,
        });
        setResult(data);
        setSelectedProviderId(data.recommended?.id ?? null);
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Could not re-sort');
      } finally {
        setResorting(false);
      }
    },
    [lastSearchText, resorting, setPriceSort, setResult, lang, searchFilters, setSelectedProviderId]
  );

  const selectedProvider = useMemo(() => {
    if (!result) return null;
    const id = selectedProviderId || result.recommended?.id;
    const pool = [
      result.recommended,
      ...(result.candidates ?? []),
      ...(result.top_three ?? []),
      ...(result.top_rated ?? []),
    ].filter(Boolean) as ProviderSummary[];
    return pool.find((p) => p.id === id) ?? result.recommended;
  }, [result, selectedProviderId]);

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
    (p) => p.id !== top.id && !topRated.some((tr) => tr.id === p.id)
  );

  const sortLabel =
    result.price_sort === 'low' ? 'Lowest price' : result.price_sort === 'high' ? 'Premium' : 'Best match';

  const serviceTitle = `${result.intent.service_label} · ${result.intent.location}`;
  const markerCount = result.map_markers?.length ?? 0;
  const estimate =
    result.pricing?.estimate_min_pkr && result.pricing?.estimate_max_pkr
      ? `~PKR ${result.pricing.estimate_min_pkr.toLocaleString()}`
      : undefined;

  const onSelect = async (id: string) => {
    await selectProvider(id);
    setSelectedProviderId(id);
  };

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
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.preview}>{t('preview_note')}</Text>
          <Text style={styles.pickHint}>{t('pick_hint')}</Text>
          <TransparentPricing pricing={result.pricing} />
          <View style={styles.sortPad}>
            <PriceSortChips value={priceSort} onChange={reSearch} />
          </View>

          {result.map_markers && result.map_markers.length > 0 ? (
            <NearbyMap
              markers={result.map_markers}
              userLat={result.user_location?.lat}
              userLng={result.user_location?.lng}
              onMarkerPress={(id) => {
                onSelect(id);
                router.push(`/provider/${id}`);
              }}
            />
          ) : null}

          {topRated.length > 0 ? (
            <View style={styles.block}>
              <SecLabel>{t('top_rated')}</SecLabel>
              {topRated.map((p) => (
                <View key={p.id} style={styles.cardWrap}>
                  <ProviderCard
                    provider={p}
                    topRated
                    selected={selectedProviderId === p.id}
                    onSelect={() => onSelect(p.id)}
                    onProfile={() => router.push(`/provider/${p.id}`)}
                    t={t}
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
                selected={selectedProviderId === top.id}
                onSelect={() => onSelect(top.id)}
                onProfile={() => router.push(`/provider/${top.id}`)}
                t={t}
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
                    selected={selectedProviderId === p.id}
                    onSelect={() => onSelect(p.id)}
                    onProfile={() => router.push(`/provider/${p.id}`)}
                    t={t}
                  />
                </View>
              ))}
            </View>
          ) : null}

          <Link href="/(tabs)/trace" asChild>
            <Pressable style={styles.traceLink}>
              <Text style={styles.traceText}>🧠 View Agent Reasoning</Text>
            </Pressable>
          </Link>
        </ScrollView>

        {selectedProvider ? (
          <CheckoutBar
            providerName={selectedProvider.name}
            subtitle={`${selectedProvider.rating.toFixed(1)}★ · ${selectedProvider.distance_km.toFixed(1)} km`}
            estimateLabel={estimate}
            onContinue={() => goToCheckout()}
          />
        ) : null}
      </CurvedSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.violetDeep },
  sheet: { flex: 1, marginTop: -20 },
  scroll: { paddingBottom: spacing.md, paddingTop: spacing.sm },
  preview: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.amber,
    marginHorizontal: spacing.lg,
    marginBottom: 4,
    fontFamily: fonts.body,
  },
  pickHint: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.text3,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    fontFamily: fonts.body,
  },
  sortPad: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  block: { marginTop: spacing.md },
  cardWrap: { marginHorizontal: spacing.lg, marginBottom: 12 },
  pcard: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.card,
  },
  pcardTop: {
    borderColor: 'rgba(124,58,237,0.35)',
    backgroundColor: colors.violetSoft,
    marginTop: 10,
  },
  pcardSelected: {
    borderColor: colors.violet,
    backgroundColor: 'rgba(124,58,237,0.12)',
  },
  selectedTag: {
    position: 'absolute',
    top: -10,
    right: 14,
    zIndex: 2,
    backgroundColor: colors.jade,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  selectedTagText: { color: '#fff', fontSize: 10, fontWeight: '700', fontFamily: fonts.body },
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
  profileLink: { marginTop: 10, alignSelf: 'flex-start' },
  profileLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.violetBright,
    fontFamily: fonts.body,
  },
  traceLink: { marginTop: spacing.md, alignItems: 'center', padding: spacing.sm },
  traceText: { color: colors.text2, fontWeight: '600', fontFamily: fonts.body },
});
