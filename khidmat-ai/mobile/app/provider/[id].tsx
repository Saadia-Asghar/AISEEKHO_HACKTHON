import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SecLabel from '../../components/ui/SecLabel';
import GoogleBadge from '../../components/GoogleBadge';
import TipCard from '../../components/TipCard';
import { showToast } from '../../lib/toastStore';
import { api, getProvider, saveProvider, unsaveProvider } from '../../api/client';
import { getSession } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { bookSelectedProvider } from '../../lib/bookingFlow';
import { useBookingStore } from '../../lib/store';

type ReviewItem = {
  rating: number;
  comment?: string;
  user_name?: string;
  tags?: string[];
  same_sector?: boolean;
};

const SAMPLE_REVIEWS = [
  { quote: 'Bahut acha kaam kiya. Time pe aaye aur AC bilkul theek kar diya.', name: 'Ahmed Khan', stars: 5 },
  { quote: 'Professional and skilled. Fair price, great service.', name: 'Sara Ahmed', stars: 5 },
];

function categoryLabel(cat: string) {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProviderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [booking, setBooking] = useState(false);
  const { result } = useBookingStore();

  useEffect(() => {
    (async () => {
      const session = await getSession();
      try {
        const p = await getProvider(id!, session?.userId);
        setSaved(Boolean((p as { is_saved?: boolean }).is_saved));
        const area = String((p as { area?: string }).area || 'G-13');
        const { data: revData } = await api.get<{ reviews: ReviewItem[] }>(
          `/api/providers/${id}/reviews`,
          { params: { location_area: area } }
        );
        setData(p as Record<string, unknown>);
        setReviews(revData.reviews || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.violet} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  const name = String(data?.name || 'Provider');
  const category = categoryLabel(String(data?.category || 'service'));
  const area = String(data?.area || 'Karachi');
  const phone = String(data?.phone || '0300-1234567');
  const rating = Number(data?.average_rating ?? data?.rating ?? 4.9);
  const jobs = Number(data?.jobs_completed ?? 847);
  const visitFee = Number(data?.visit_fee_pkr ?? 500);
  const hourly = Number(data?.hourly_rate_pkr ?? 1500);
  const responseMin = Number(data?.response_time_min ?? 25);
  const lat = Number(data?.lat ?? 0);
  const lng = Number(data?.lng ?? 0);

  const displayReviews =
    reviews.length > 0
      ? reviews.filter((r) => r.comment).map((r) => ({
          quote: r.comment!,
          name: r.user_name || 'Customer',
          stars: r.rating,
        }))
      : SAMPLE_REVIEWS;

  const callProvider = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const tel = phone.replace(/\s/g, '');
    Linking.openURL(`tel:${tel.startsWith('+') ? tel : tel}`);
  };

  const openMaps = () => {
    if (lat && lng) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    } else {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(area + ' Islamabad')}`);
    }
  };

  const onSave = async () => {
    const session = await getSession();
    if (!session) return;
    if (saved) {
      await unsaveProvider(session.userId, id!);
      setSaved(false);
      showToast(t('unsave_worker'));
    } else {
      await saveProvider(session.userId, id!);
      setSaved(true);
      showToast(t('save_worker'));
    }
  };

  const onBook = async () => {
    if (!result?.session_id) {
      showToast(t('search_first'));
      router.replace('/');
      return;
    }
    if (booking) return;
    setBooking(true);
    try {
      await bookSelectedProvider(id!);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.pageHeader}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.pageTitle}>{t('provider_profile')}</Text>
          <Badge label={`✓ ${t('verified')}`} variant="jade" />
        </View>

        <View style={styles.provHero}>
          <Avatar name={name} size={84} square />
          <Text style={styles.provName}>{name}</Text>
          <Text style={styles.provRole}>{category} · {area}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.stars}>★★★★★</Text>
            <Text style={styles.ratingNum}>{rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({reviews.length || 148} reviews)</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statN, { color: colors.violetBright }]}>{jobs}</Text>
              <Text style={styles.statL}>Jobs Done</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statN, { color: colors.amber }]}>8yr</Text>
              <Text style={styles.statL}>Experience</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statN, { color: colors.jade }]}>{responseMin}m</Text>
              <Text style={styles.statL}>Response</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLine}>Visit from PKR {visitFee.toLocaleString()}</Text>
            <Text style={styles.priceLine}>Hourly from PKR {hourly.toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>
          <TipCard
            tipId="provider_book"
            title={t('provider_ready')}
            message={t('provider_ready_msg')}
          />
        </View>

        <View style={styles.skills}>
          <SecLabel>{t('skills')}</SecLabel>
          <View style={styles.skillRow}>
            {['❄️ Split AC', '🔧 Window AC', '⚙️ Gas Refill', '🔌 Wiring'].map((s) => (
              <View key={s} style={styles.skillChip}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.reviewsSection}>
          <SecLabel>{`Reviews — ${t('same_sector_reviews')}`}</SecLabel>
          {reviews
            .filter((r) => r.same_sector)
            .slice(0, 2)
            .map((r, i) => (
              <View key={`sec-${i}`} style={[styles.reviewItem, styles.sectorReview]}>
                <Text style={styles.sectorBadge}>📍 Your sector</Text>
                <Text style={styles.revText}>{r.comment}</Text>
              </View>
            ))}
          {displayReviews.map((r, i) => (
            <View key={i} style={styles.reviewItem}>
              <View style={styles.revUser}>
                <Avatar name={r.name} size={34} square />
                <View style={{ flex: 1 }}>
                  <Text style={styles.revName}>{r.name}</Text>
                </View>
                <Text style={styles.revStars}>{'★'.repeat(r.stars)}</Text>
              </View>
              <Text style={styles.revText}>{r.quote}</Text>
            </View>
          ))}
        </View>

        <Button
          label={saved ? t('unsave_worker') : t('save_worker')}
          variant="outline"
          onPress={onSave}
          style={{ width: '100%', marginBottom: 10 }}
        />
        <Button
          label={`${t('provider_book')}: ${name}`}
          onPress={onBook}
          loading={booking}
          style={{ width: '100%', marginBottom: 10 }}
        />
        <Button label={t('open_maps')} variant="outline" onPress={openMaps} style={{ width: '100%', marginBottom: 10 }} />
        <Button label={`📞 ${t('call_provider')}`} variant="outline" onPress={callProvider} style={{ width: '100%' }} />
        <GoogleBadge />
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
  pageTitle: { flex: 1, fontFamily: fonts.display, fontSize: 17, fontWeight: '600', color: colors.text },
  provHero: { alignItems: 'center', padding: spacing.lg },
  provName: { fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.text, marginTop: 12 },
  provRole: { fontSize: 13, color: colors.text2, marginTop: 4, fontFamily: fonts.body },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  stars: { color: colors.amber, fontSize: 14 },
  ratingNum: { fontWeight: '600', color: colors.text, fontFamily: fonts.body },
  reviewCount: { fontSize: 12, color: colors.text2, fontFamily: fonts.body },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.r,
    padding: 12,
    alignItems: 'center',
  },
  statN: { fontFamily: fonts.display, fontSize: 20, fontWeight: '600' },
  statL: { fontSize: 11, color: colors.text2, marginTop: 2, fontFamily: fonts.body },
  priceRow: { marginTop: 12, gap: 4 },
  priceLine: { fontSize: 12, color: colors.text2, textAlign: 'center', fontFamily: fonts.body },
  skills: { paddingHorizontal: spacing.lg, marginBottom: 16 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
  },
  skillText: { fontSize: 12, color: colors.text2, fontFamily: fonts.body },
  reviewsSection: { paddingHorizontal: spacing.lg },
  reviewItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  revUser: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  revName: { fontSize: 13, fontWeight: '600', color: colors.text, fontFamily: fonts.body },
  revStars: { color: colors.amber, fontSize: 13 },
  revText: { fontSize: 13, color: colors.text2, lineHeight: 20, fontFamily: fonts.body },
  sectorReview: { backgroundColor: colors.violetSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: 8 },
  sectorBadge: { fontSize: 10, fontWeight: '700', color: colors.violetBright, marginBottom: 6, fontFamily: fonts.body },
});
