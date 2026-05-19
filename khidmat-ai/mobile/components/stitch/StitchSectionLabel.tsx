import { StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';

export default function StitchSectionLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.text2,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    fontFamily: fonts.body,
  },
});
