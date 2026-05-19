import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import { fonts, radius, spacing } from '../constants/theme';
import { useI18n } from '../lib/i18n';
import type { PriceSort } from '../api/client';

export type SearchFilterState = {
  maxDistanceKm: number | null;
  minRating: number | null;
  verifiedOnly: boolean;
  availableToday: boolean;
  priceTier: 'any' | 'budget' | 'premium';
};

export const defaultSearchFilters: SearchFilterState = {
  maxDistanceKm: null,
  minRating: null,
  verifiedOnly: false,
  availableToday: false,
  priceTier: 'any',
};

export function priceSortFromFilters(
  filters: SearchFilterState,
  fallback: PriceSort = 'smart'
): PriceSort {
  if (filters.priceTier === 'budget') return 'low';
  if (filters.priceTier === 'premium') return 'high';
  return fallback;
}

type ActiveChip = { key: string; label: string; clear: () => void };

export default function SearchFilterDropdown({
  value,
  onChange,
  areaLabel,
}: {
  value: SearchFilterState;
  onChange: (v: SearchFilterState) => void;
  areaLabel?: string;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const chips: ActiveChip[] = useMemo(() => {
    const list: ActiveChip[] = [];
    if (value.maxDistanceKm != null) {
      list.push({
        key: 'dist',
        label: t('filter_dist_km').replace('{n}', String(value.maxDistanceKm)),
        clear: () => onChange({ ...value, maxDistanceKm: null }),
      });
    }
    if (value.minRating != null) {
      list.push({
        key: 'rating',
        label: t('filter_rating_min').replace('{n}', String(value.minRating)),
        clear: () => onChange({ ...value, minRating: null }),
      });
    }
    if (value.priceTier !== 'any') {
      list.push({
        key: 'price',
        label: value.priceTier === 'budget' ? t('filter_price_budget') : t('filter_price_premium'),
        clear: () => onChange({ ...value, priceTier: 'any' }),
      });
    }
    if (value.verifiedOnly) {
      list.push({
        key: 'verified',
        label: t('filter_verified'),
        clear: () => onChange({ ...value, verifiedOnly: false }),
      });
    }
    if (value.availableToday) {
      list.push({
        key: 'today',
        label: t('filter_today'),
        clear: () => onChange({ ...value, availableToday: false }),
      });
    }
    if (areaLabel?.trim()) {
      list.push({
        key: 'area',
        label: `${t('filter_location')}: ${areaLabel.trim()}`,
        clear: () => {},
      });
    }
    return list;
  }, [value, onChange, areaLabel, t]);

  const clearAll = () => onChange({ ...defaultSearchFilters });

  const pickDistance = (km: number | null) => onChange({ ...value, maxDistanceKm: km });
  const pickRating = (r: number | null) => onChange({ ...value, minRating: r });
  const pickPrice = (tier: SearchFilterState['priceTier']) => onChange({ ...value, priceTier: tier });

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <Pressable style={styles.dropdownBtn} onPress={() => setOpen(true)}>
          <Text style={styles.dropdownIcon}>▾</Text>
          <Text style={styles.dropdownLabel}>{t('filters')}</Text>
          {chips.length > 0 ? (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{chips.length}</Text>
            </View>
          ) : null}
        </Pressable>
        {chips.length > 0 ? (
          <Pressable onPress={clearAll} hitSlop={8}>
            <Text style={styles.clearAll}>{t('clear_filters')}</Text>
          </Pressable>
        ) : null}
      </View>

      {chips.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {chips.map((c) => (
            <Pressable key={c.key} style={styles.chip} onPress={c.clear}>
              <Text style={styles.chipText}>{c.label}</Text>
              {c.key !== 'area' ? <Text style={styles.chipX}> ×</Text> : null}
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{t('filters')}</Text>

            <Text style={styles.groupLabel}>{t('filter_group_distance')}</Text>
            <View style={styles.optionRow}>
              {[
                { label: t('filter_any'), km: null },
                { label: '2 km', km: 2 },
                { label: '5 km', km: 5 },
                { label: '10 km', km: 10 },
                { label: '15 km', km: 15 },
              ].map((o) => (
                <Pressable
                  key={o.label}
                  style={[styles.option, value.maxDistanceKm === o.km && styles.optionOn]}
                  onPress={() => pickDistance(o.km)}
                >
                  <Text style={[styles.optionText, value.maxDistanceKm === o.km && styles.optionTextOn]}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.groupLabel}>{t('filter_group_rating')}</Text>
            <View style={styles.optionRow}>
              {[
                { label: t('filter_any'), r: null },
                { label: '3★+', r: 3 },
                { label: '4★+', r: 4 },
                { label: '4.5★+', r: 4.5 },
              ].map((o) => (
                <Pressable
                  key={o.label}
                  style={[styles.option, value.minRating === o.r && styles.optionOn]}
                  onPress={() => pickRating(o.r)}
                >
                  <Text style={[styles.optionText, value.minRating === o.r && styles.optionTextOn]}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.groupLabel}>{t('filter_group_price')}</Text>
            <View style={styles.optionRow}>
              {(
                [
                  ['any', t('filter_any')],
                  ['budget', t('filter_price_budget')],
                  ['premium', t('filter_price_premium')],
                ] as const
              ).map(([tier, label]) => (
                <Pressable
                  key={tier}
                  style={[styles.option, value.priceTier === tier && styles.optionOn]}
                  onPress={() => pickPrice(tier)}
                >
                  <Text style={[styles.optionText, value.priceTier === tier && styles.optionTextOn]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.groupLabel}>{t('filter_group_more')}</Text>
            <Pressable
              style={styles.toggleRow}
              onPress={() => onChange({ ...value, verifiedOnly: !value.verifiedOnly })}
            >
              <Text style={styles.toggleLabel}>{t('filter_verified')}</Text>
              <Text style={styles.toggleVal}>{value.verifiedOnly ? '✓' : '○'}</Text>
            </Pressable>
            <Pressable
              style={styles.toggleRow}
              onPress={() => onChange({ ...value, availableToday: !value.availableToday })}
            >
              <Text style={styles.toggleLabel}>{t('filter_today')}</Text>
              <Text style={styles.toggleVal}>{value.availableToday ? '✓' : '○'}</Text>
            </Pressable>

            <Pressable style={styles.doneBtn} onPress={() => setOpen(false)}>
              <Text style={styles.doneText}>{t('apply_filters')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.sm },
    toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    dropdownBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    dropdownIcon: { color: colors.primaryText, fontSize: 12 },
    dropdownLabel: { fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: fonts.body },
    countBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.violet,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    countText: { fontSize: 11, fontWeight: '700', color: colors.onPrimaryContainer, fontFamily: fonts.body },
    clearAll: { fontSize: 12, color: colors.primaryText, fontWeight: '600', fontFamily: fonts.body },
    chipScroll: { marginTop: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.violet,
      backgroundColor: colors.violetSoft,
    },
    chipText: { fontSize: 11, color: colors.primaryText, fontFamily: fonts.body },
    chipX: { fontSize: 12, color: colors.primaryText, fontWeight: '700' },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      maxHeight: '85%',
    },
    sheetTitle: {
      fontFamily: fonts.display,
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.md,
    },
    groupLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.text3,
      marginTop: spacing.sm,
      marginBottom: 8,
      fontFamily: fonts.body,
    },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    optionOn: { borderColor: colors.violet, backgroundColor: colors.violetSoft },
    optionText: { fontSize: 13, color: colors.text2, fontFamily: fonts.body },
    optionTextOn: { color: colors.primaryText, fontWeight: '600' },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    toggleLabel: { fontSize: 15, color: colors.text, fontFamily: fonts.body },
    toggleVal: { fontSize: 18, color: colors.primaryText },
    doneBtn: {
      marginTop: spacing.lg,
      backgroundColor: colors.violet,
      paddingVertical: 14,
      borderRadius: radius.lg,
      alignItems: 'center',
    },
    doneText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onPrimaryContainer,
      fontFamily: fonts.body,
    },
  });
}
