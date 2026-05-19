import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { AppColors } from '../constants/theme';
import { fonts, radius, shadows, spacing } from '../constants/theme';
import ThemedSafeArea from '../components/ThemedSafeArea';
import { getServiceCategories, type ServiceCategory } from '../api/client';
import { useBookingStore } from '../lib/store';
import { useI18n } from '../lib/i18n';
import { formatCategorySearch, runDiscoverSearch } from '../lib/discoverSearch';
import StitchAppHeader from '../components/stitch/StitchAppHeader';
import StitchGlassCard from '../components/stitch/StitchGlassCard';
import SearchFilterDropdown from '../components/SearchFilterDropdown';
import { useTheme } from '../lib/ThemeContext';
import ShimmerOverlay from '../components/ShimmerOverlay';
import SecLabel from '../components/ui/SecLabel';
import { showToast } from '../lib/toastStore';

export default function BrowseScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => browseStyles(colors), [colors]);
  const { category: preselect } = useLocalSearchParams<{ category?: string }>();
  const { t, lang } = useI18n();
  const { loading, searchFilters, setSearchFilters } = useBookingStore();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [fetching, setFetching] = useState(true);
  const [area, setArea] = useState('G-13');
  const [query, setQuery] = useState('');
  const submitting = useRef(false);

  useEffect(() => {
    getServiceCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => setCategories([]))
      .finally(() => setFetching(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.id.replace(/_/g, ' ').includes(q)
    );
  }, [categories, query]);

  const onCategory = useCallback(
    async (cat: ServiceCategory) => {
      if (submitting.current || loading) return;
      submitting.current = true;
      try {
        const template = lang === 'ur' ? cat.search_template_ur : cat.search_template_en;
        const text = formatCategorySearch(template, area);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await runDiscoverSearch(text, lang, t);
      } catch {
        showToast(t('connect_error'));
      } finally {
        submitting.current = false;
      }
    },
    [area, lang, loading, t]
  );

  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !preselect || fetching || categories.length === 0) return;
    const cat = categories.find((c) => c.id === preselect);
    if (cat) {
      autoRan.current = true;
      onCategory(cat);
    }
  }, [preselect, fetching, categories, onCategory]);

  return (
    <ThemedSafeArea edges={['top', 'bottom']}>
      <StitchAppHeader onBack={() => router.back()} />
      <View style={styles.head}>
        <Text style={styles.headTitle}>{t('browse_title')}</Text>
        <Text style={styles.headSub}>{t('browse_sub')}</Text>
      </View>
      <StitchGlassCard style={styles.toolbar}>
          <Text style={styles.areaLabel}>{t('browse_area')}</Text>
          <TextInput
            style={styles.areaInput}
            value={area}
            onChangeText={setArea}
            placeholder="G-13, F-7, DHA…"
            placeholderTextColor={colors.text3}
          />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t('browse_search')}
            placeholderTextColor={colors.text3}
          />
          <SearchFilterDropdown value={searchFilters} onChange={setSearchFilters} areaLabel={area} />
      </StitchGlassCard>

        {fetching ? (
          <ActivityIndicator color={colors.violet} style={{ marginTop: spacing.xl }} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <SecLabel>
              {t('browse_count').replace('{n}', String(filtered.length))}
            </SecLabel>
            <View style={styles.grid}>
              {filtered.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
                  onPress={() => onCategory(cat)}
                  disabled={loading}
                >
                  <Text style={styles.emoji}>{cat.emoji}</Text>
                  <Text style={styles.tileLabel}>{cat.label}</Text>
                  <Text style={styles.tileMeta}>
                    {cat.provider_count} {t('browse_workers')}
                  </Text>
                  <Text style={styles.tilePrice}>
                    PKR {cat.price_min_pkr.toLocaleString()}–{cat.price_max_pkr.toLocaleString()}
                  </Text>
                  <Text style={styles.tileCta}>{t('browse_find')} →</Text>
                </Pressable>
              ))}
            </View>
            {filtered.length === 0 ? (
              <Text style={styles.empty}>{t('browse_empty')}</Text>
            ) : null}
          </ScrollView>
        )}
      <ShimmerOverlay visible={loading} />
    </ThemedSafeArea>
  );
}

function browseStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  headTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: '600',
    color: colors.primaryText,
  },
  headSub: { fontSize: 14, color: colors.text2, marginTop: 6, fontFamily: fonts.body },
  toolbar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  areaLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.text3,
    fontFamily: fonts.body,
  },
  areaInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.body,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  filterNote: {
    fontSize: 11,
    color: colors.text3,
    fontFamily: fonts.body,
    lineHeight: 16,
  },
  scroll: { paddingBottom: spacing.xl, paddingTop: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  tile: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 148,
    ...shadows.card,
  },
  tilePressed: { borderColor: colors.violet, backgroundColor: colors.violetSoft },
  emoji: { fontSize: 28, marginBottom: 8 },
  tileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: fonts.body,
  },
  tileMeta: {
    fontSize: 11,
    color: colors.text2,
    marginTop: 4,
    fontFamily: fonts.body,
  },
  tilePrice: {
    fontSize: 10,
    color: colors.jade,
    marginTop: 4,
    fontFamily: fonts.body,
  },
  tileCta: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.violetBright,
    marginTop: 10,
    fontFamily: fonts.body,
  },
  empty: {
    textAlign: 'center',
    color: colors.text3,
    padding: spacing.xl,
    fontFamily: fonts.body,
  },
  });
}
