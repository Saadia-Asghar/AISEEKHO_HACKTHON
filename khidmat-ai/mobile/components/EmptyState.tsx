import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '../constants/theme';
import { fonts, spacing } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';
import Button from './ui/Button';

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => emptyStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={{ marginTop: spacing.lg, minWidth: 200 }} />
      ) : null}
    </View>
  );
}

function emptyStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: { alignItems: 'center', padding: spacing.xl, paddingTop: 48 },
    icon: { fontSize: 48, marginBottom: spacing.md, opacity: 0.5 },
    title: {
      fontFamily: fonts.display,
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      color: colors.text2,
      textAlign: 'center',
      lineHeight: 22,
      fontFamily: fonts.body,
      maxWidth: 300,
    },
  });
}
