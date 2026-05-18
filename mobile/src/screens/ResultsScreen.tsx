import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { useUserStore } from '../store/useUserStore';
import { useTheme } from '../hooks/useTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { ThemeColors } from '../constants/theme';
import { FONT_BOLD, FONT_REGULAR, RADIUS_XL } from '../constants/theme';
import type { ProviderProfile } from '../api/api';
import ProviderBottomSheet from '../components/ProviderBottomSheet';
import HapticPressable from '../components/HapticPressable';
import { SkeletonList } from '../components/Skeleton';
import type { HomeStackParamList } from '../navigation/HomeStackNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Results'>;

function ProviderCard({
  p,
  styles,
  onPress,
}: {
  p: ProviderProfile;
  styles: ReturnType<typeof useThemedStyles<ReturnType<typeof createStyles>>>;
  onPress: () => void;
}) {
  return (
    <HapticPressable style={styles.card} onPress={onPress}>
      <View style={styles.cardTop}>
        <Text style={styles.name}>{p.name}</Text>
        {p.verified ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓ Verified</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.meta}>
        ★ {p.rating}
        {p.distance_km != null ? ` · ${p.distance_km.toFixed(1)} km` : ''} · {p.area}
      </Text>
      <Text style={styles.price}>
        PKR {p.price_min_pkr ?? '—'} – {p.price_max_pkr ?? '—'}
      </Text>
    </HapticPressable>
  );
}

export default function ResultsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const result = useAppStore((s) => s.result);
  const userId = useUserStore((s) => s.userId);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(null);

  const providers: ProviderProfile[] = result
    ? [...(result.top_three || []), result.recommended].filter(
        (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
      )
    : [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 400));
    setRefreshing(false);
  }, []);

  if (!result) {
    return (
      <View style={styles.empty}>
        <Text style={styles.muted}>No results yet. Describe a service on Home.</Text>
        <HapticPressable style={styles.retryBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.retryText}>Go home</Text>
        </HapticPressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {refreshing ? (
          <SkeletonList count={3} />
        ) : (
          <>
            <Text style={styles.summary}>{result.trace_summary?.outcome || result.intent.service_label}</Text>
            <Text style={styles.section}>Providers for you</Text>
            {providers.map((p) => (
              <ProviderCard key={p.id} p={p} styles={styles} onPress={() => setSheetId(p.id)} />
            ))}
            <HapticPressable
              haptic="success"
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('BookingConfirm')}
            >
              <Text style={styles.primaryBtnText}>Confirm booking</Text>
            </HapticPressable>
            <HapticPressable style={styles.ghostBtn} onPress={() => navigation.navigate('AgentTrace')}>
              <Text style={styles.ghostBtnText}>View agent trace</Text>
            </HapticPressable>
          </>
        )}
      </ScrollView>
      <ProviderBottomSheet
        providerId={sheetId}
        userId={userId ?? undefined}
        onClose={() => setSheetId(null)}
        onBook={() => {
          setSheetId(null);
          navigation.navigate('BookingConfirm');
        }}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.bg },
    muted: { color: colors.muted, textAlign: 'center', fontFamily: FONT_REGULAR },
    summary: { color: colors.primary, marginBottom: 16, lineHeight: 22, fontFamily: FONT_REGULAR },
    section: { color: colors.dim, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 10 },
    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS_XL,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.primary,
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    name: { color: colors.text, fontSize: 17, fontWeight: '700', flex: 1, fontFamily: FONT_BOLD },
    badge: { backgroundColor: colors.success, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    meta: { color: colors.muted, marginTop: 6, fontFamily: FONT_REGULAR },
    price: { color: colors.accent, fontWeight: '700', marginTop: 8, fontFamily: FONT_BOLD },
    primaryBtn: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: RADIUS_XL,
      alignItems: 'center',
      marginTop: 8,
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 10,
    },
    primaryBtnText: { color: '#FFF', fontWeight: '700', fontFamily: FONT_BOLD },
    ghostBtn: {
      marginTop: 10,
      padding: 14,
      borderRadius: RADIUS_XL,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
    },
    ghostBtnText: { color: colors.primary, fontWeight: '600' },
    retryBtn: { marginTop: 16, padding: 12, backgroundColor: colors.primary, borderRadius: 12 },
    retryText: { color: '#FFF', fontWeight: '700' },
  });
