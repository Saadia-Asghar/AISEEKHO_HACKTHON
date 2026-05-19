import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../constants/theme';
import { useI18n } from '../lib/i18n';

const TAG_KEYS = ['tag_on_time', 'tag_fair_price', 'tag_fixed_first'] as const;

export default function ReviewTagPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const { t } = useI18n();

  const toggle = (key: (typeof TAG_KEYS)[number]) => {
    const label = t(key);
    if (selected.includes(label)) onChange(selected.filter((x) => x !== label));
    else onChange([...selected, label]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('review_tags')}</Text>
      <View style={styles.row}>
        {TAG_KEYS.map((key) => {
          const label = t(key);
          const on = selected.includes(label);
          return (
            <Pressable key={key} style={[styles.chip, on && styles.chipOn]} onPress={() => toggle(key)}>
              <Text style={[styles.text, on && styles.textOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  title: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 8, fontFamily: fonts.body },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.jadeSoft, borderColor: colors.jade },
  text: { fontSize: 12, color: colors.text2, fontFamily: fonts.body },
  textOn: { color: colors.jade, fontWeight: '600' },
});
