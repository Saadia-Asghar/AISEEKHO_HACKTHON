import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { AppColors } from '../constants/theme';
import { fonts, radius, spacing } from '../constants/theme';
import ThemedSafeArea from '../components/ThemedSafeArea';
import StitchAppHeader from '../components/stitch/StitchAppHeader';
import Avatar from '../components/Avatar';
import Button from '../components/ui/Button';
import {
  getServiceCategories,
  listProvidersByCategory,
  type ListedProvider,
  type ServiceCategory,
} from '../api/client';
import { useI18n } from '../lib/i18n';
import { useTheme } from '../lib/ThemeContext';
import { getUserCoords } from '../lib/location';
import { formatCategorySearch, runDiscoverSearch } from '../lib/discoverSearch';
import { useBookingStore } from '../lib/store';
import { showToast } from '../lib/toastStore';

export default function WorkersScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => workerStyles(colors), [colors]);
  const params = useLocalSearchParams<{
    category?: string;
    label?: string;
    area?: string;
  }>();
  const { t, lang } = useI18n();
  const { loading } = useBookingStore();

  const category = params.category ?? '';
  const area = (params.area ?? '').trim();
  const [label, setLabel] = useState(params.label ?? category.replace(/_/g, ' '));
  const [workers, setWorkers] = useState<ListedProvider[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryMeta, setCategoryMeta] = useState<ServiceCategory | null>(null);

  const load = useCallback(async () => {
    if (!category) return;
    setFetching(true);
    setError(null);
    try {
      const coords = await getUserCoords();
      const data = await listProvidersByCategory(category, area, {
        userLat: coords.lat,
        userLng: coords.lng,
      });
      setWorkers(data.providers);
    } catch (e) {
      setWorkers([]);
      setError(e instanceof Error ? e.message : t('connect_error'));
    } finally {
      setFetching(false);
    }
  }, [category, area, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getServiceCategories()
      .then((data) => {
        const cat = data.categories.find((c) => c.id === category);
        if (cat) {
          setCategoryMeta(cat);
          setLabel(cat.label);
        }
      })
      .catch(() => {});
  }, [category]);

  const runAiMatch = async () => {
    if (!categoryMeta || loading) return;
    try {
      const template = lang === 'ur' ? categoryMeta.search_template_ur : categoryMeta.search_template_en;
        const text = formatCategorySearch(template, area || 'Islamabad');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await runDiscoverSearch(text, lang, t);
    } catch {
      showToast(t('connect_error'));
    }
  };

  return (
    <ThemedSafeArea edges={['top', 'bottom']}>
      <StitchAppHeader onBack={() => router.back()} />
      <View style={styles.head}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.sub}>
          {area
            ? t('workers_sub').replace('{area}', area)
            : t('workers_all_areas')}{' '}
          · {workers.length} {t('browse_workers')}
        </Text>
      </View>

      <View style={styles.aiBar}>
        <Button
          label={t('workers_ai_match')}
          variant="violet"
          onPress={runAiMatch}
          loading={loading}
          style={{ flex: 1 }}
        />
      </View>

      {fetching ? (
        <ActivityIndicator color={colors.violet} style={{ marginTop: spacing.xl }} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Button label={t('retry')} variant="outline" onPress={load} style={{ marginTop: spacing.md }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {workers.map((w) => (
            <Pressable
              key={w.id}
              style={styles.row}
              onPress={() => router.push(`/provider/${w.id}`)}
            >
              <Avatar name={w.name} size={48} />
              <View style={styles.rowBody}>
                <Text style={styles.name}>{w.name}</Text>
                <Text style={styles.meta}>
                  ★ {(w.rating ?? 0).toFixed(1)} · {w.distance_km?.toFixed(1) ?? '—'} km · {w.area}
                </Text>
                {w.price_min_pkr ? (
                  <Text style={styles.price}>
                    PKR {w.price_min_pkr.toLocaleString()}–{(w.price_max_pkr ?? w.price_min_pkr).toLocaleString()}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
          {workers.length === 0 ? (
            <Text style={styles.empty}>{t('workers_empty')}</Text>
          ) : null}
        </ScrollView>
      )}
    </ThemedSafeArea>
  );
}

function workerStyles(colors: AppColors) {
  return StyleSheet.create({
    head: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
    title: {
      fontFamily: fonts.display,
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
    },
    sub: { fontSize: 14, color: colors.text2, marginTop: 6, fontFamily: fonts.body },
    aiBar: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: 10 },
    row: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    rowMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: spacing.md,
    },
    bookBtn: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 10,
      alignItems: 'center',
      backgroundColor: colors.violetSoft,
    },
    bookBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.violetBright,
      fontFamily: fonts.body,
    },
    rowBody: { flex: 1 },
    name: { fontSize: 15, fontWeight: '600', color: colors.text, fontFamily: fonts.body },
    meta: { fontSize: 12, color: colors.text2, marginTop: 4, fontFamily: fonts.body },
    price: { fontSize: 11, color: colors.jade, marginTop: 4, fontFamily: fonts.body },
    chevron: { fontSize: 22, color: colors.text3 },
    empty: { textAlign: 'center', color: colors.text3, padding: spacing.xl, fontFamily: fonts.body },
    center: { padding: spacing.xl, alignItems: 'center' },
    errorText: { color: colors.rose, textAlign: 'center', fontFamily: fonts.body },
  });
}
