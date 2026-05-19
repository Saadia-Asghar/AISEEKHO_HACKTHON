import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useI18n } from '../lib/i18n';

export type SearchFilterState = {
  maxDistanceKm: number | null;
  minRating: number | null;
  verifiedOnly: boolean;
  availableToday: boolean;
};

export default function SearchFilters({
  value,
  onChange,
}: {
  value: SearchFilterState;
  onChange: (v: SearchFilterState) => void;
}) {
  const { t } = useI18n();
  const chips = [
    {
      key: 'dist',
      label: t('filter_distance'),
      on: value.maxDistanceKm === 5,
      toggle: () =>
        onChange({ ...value, maxDistanceKm: value.maxDistanceKm === 5 ? null : 5 }),
    },
    {
      key: 'rating',
      label: t('filter_rating'),
      on: value.minRating === 4,
      toggle: () => onChange({ ...value, minRating: value.minRating === 4 ? null : 4 }),
    },
    {
      key: 'verified',
      label: t('filter_verified'),
      on: value.verifiedOnly,
      toggle: () => onChange({ ...value, verifiedOnly: !value.verifiedOnly }),
    },
    {
      key: 'today',
      label: t('filter_today'),
      on: value.availableToday,
      toggle: () => onChange({ ...value, availableToday: !value.availableToday }),
    },
  ];

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('filters')}</Text>
      <View style={styles.row}>
        {chips.map((c) => (
          <Pressable key={c.key} style={[styles.chip, c.on && styles.chipOn]} onPress={c.toggle}>
            <Text style={[styles.label, c.on && styles.labelOn]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.text3,
    marginBottom: 8,
    fontFamily: fonts.body,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipOn: { borderColor: colors.violet, backgroundColor: colors.violetSoft },
  label: { fontSize: 11, color: colors.text3, fontFamily: fonts.body },
  labelOn: { color: colors.violetBright, fontWeight: '600' },
});
