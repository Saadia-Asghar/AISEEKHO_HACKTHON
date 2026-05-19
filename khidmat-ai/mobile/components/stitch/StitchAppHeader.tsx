import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, spacing } from '../../constants/theme';
import { useTheme } from '../../lib/ThemeContext';

/** Fixed top bar — matches Stitch home_screen / search_results HTML */
export default function StitchAppHeader({
  title = 'KhidmatAI',
  onBack,
  onSettings,
  right,
}: {
  title?: string;
  onBack?: () => void;
  onSettings?: () => void;
  right?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
            <Text style={styles.back}>←</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right ?? (
        onSettings ? (
          <Pressable onPress={onSettings} style={styles.iconBtn} accessibilityLabel="Settings">
            <Text style={styles.icon}>⚙️</Text>
          </Pressable>
        ) : (
          <View style={styles.iconSpacer} />
        )
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      height: 56,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bg,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    backBtn: { padding: 4 },
    back: { color: colors.primaryText, fontSize: 22, fontWeight: '600' },
    title: {
      fontFamily: fonts.display,
      fontSize: 22,
      fontWeight: '700',
      color: colors.primaryText,
      letterSpacing: -0.3,
    },
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: { fontSize: 20 },
    iconSpacer: { width: 40 },
  });
}
