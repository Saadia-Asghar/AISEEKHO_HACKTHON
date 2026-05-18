import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../constants/theme';

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(opt.key)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  tabActive: {
    backgroundColor: colors.violet,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.text3, fontFamily: fonts.body },
  labelActive: { color: colors.text },
});
