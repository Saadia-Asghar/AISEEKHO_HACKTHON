import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { getProvider, getProviderReviews } from '../api/client';
import type { ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import HazirLogo from './HazirLogo';
import HapticPressable from './HapticPressable';

type Props = {
  providerId: string | null;
  userId?: string;
  onClose: () => void;
  onBook?: () => void;
};

export default function ProviderBottomSheet({ providerId, userId, onClose, onBook }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['42%', '88%'], []);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [reviews, setReviews] = useState<Array<{ rating: number; comment?: string; user_name: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!providerId) {
      sheetRef.current?.close();
      return;
    }
    setLoading(true);
    Promise.all([getProvider(providerId, userId), getProviderReviews(providerId)])
      .then(([p, r]) => {
        setProfile(p as Record<string, unknown>);
        setReviews((r.reviews as typeof reviews) || []);
        sheetRef.current?.expand();
      })
      .catch(() => {
        setProfile(null);
        sheetRef.current?.expand();
      })
      .finally(() => setLoading(false));
  }, [providerId, userId]);

  const renderBackdrop = useCallback(
    (props: ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.55} />
    ),
    []
  );

  const phone = profile?.phone as string | undefined;

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.muted, width: 48 }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : profile ? (
          <>
            <View style={styles.header}>
              <HazirLogo size={48} />
              <View style={styles.headerText}>
                <Text style={styles.name}>{profile.name as string}</Text>
                {(profile.verified as boolean) ? (
                  <Text style={styles.verified}>✓ Verified provider</Text>
                ) : null}
              </View>
            </View>
            <Text style={styles.bio}>{profile.bio as string}</Text>
            <Text style={styles.price}>
              PKR {String(profile.price_min_pkr ?? '')} – {String(profile.price_max_pkr ?? '')}
            </Text>
            <Text style={styles.meta}>
              ★ {profile.rating as number} · {profile.review_count as number} reviews · {profile.area as string}
            </Text>
            {phone ? (
              <HapticPressable
                haptic="medium"
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`)}
              >
                <Text style={styles.btnText}>Call</Text>
              </HapticPressable>
            ) : null}
            {onBook ? (
              <HapticPressable
                haptic="success"
                style={[styles.btn, { backgroundColor: colors.accent }]}
                onPress={() => {
                  onBook();
                  onClose();
                }}
              >
                <Text style={styles.btnText}>Book</Text>
              </HapticPressable>
            ) : null}
            <Text style={styles.section}>Reviews</Text>
            {reviews.length === 0 ? (
              <Text style={styles.muted}>No reviews yet.</Text>
            ) : (
              reviews.map((r, i) => (
                <View key={i} style={styles.review}>
                  <Text style={styles.reviewTitle}>{'★'.repeat(r.rating)} · {r.user_name}</Text>
                  {r.comment ? <Text style={styles.muted}>{r.comment}</Text> : null}
                </View>
              ))
            )}
          </>
        ) : (
          <Text style={styles.muted}>Could not load provider.</Text>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingBottom: 36 },
    loader: { paddingVertical: 48, alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    headerText: { flex: 1, marginLeft: 12 },
    name: { fontSize: 20, fontWeight: '700', color: colors.text },
    verified: { color: colors.success, marginTop: 4, fontSize: 13 },
    bio: { color: colors.muted, lineHeight: 22, marginTop: 4 },
    price: { color: colors.warning, fontWeight: '700', fontSize: 16, marginTop: 12 },
    meta: { color: colors.muted, marginTop: 8 },
    btn: { marginTop: 12, padding: 14, borderRadius: 12, alignItems: 'center' },
    btnPrimary: { backgroundColor: colors.primary },
    btnSuccess: { backgroundColor: colors.success },
    btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    section: {
      marginTop: 20,
      marginBottom: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
      fontSize: 12,
      color: colors.dim,
    },
    muted: { color: colors.muted },
    review: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    reviewTitle: { color: colors.text, fontWeight: '600' },
  });
