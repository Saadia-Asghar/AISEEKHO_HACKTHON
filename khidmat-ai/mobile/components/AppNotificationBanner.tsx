import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius, spacing } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';
import { useAppNotifications } from '../lib/appNotifications';

export default function AppNotificationBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { items, hydrated, hydrate, markRead, unreadCount } = useAppNotifications();
  const styles = useMemo(() => bannerStyles(colors), [colors]);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  const latest = items.find((n) => !n.read);
  if (!latest) return null;

  return (
    <Pressable
      style={[styles.wrap, { top: insets.top + 4 }]}
      onPress={() => markRead(latest.id)}
    >
      <Text style={styles.icon}>🔔</Text>
      <View style={styles.textCol}>
        <Text style={styles.title} numberOfLines={1}>
          {latest.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {latest.body}
        </Text>
      </View>
      {unreadCount() > 1 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount()}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function bannerStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      zIndex: 9999,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.violet,
      borderRadius: radius.lg,
      padding: spacing.md,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    icon: { fontSize: 22 },
    textCol: { flex: 1 },
    title: {
      fontFamily: fonts.body,
      fontSize: 14,
      fontWeight: '700',
      color: colors.onPrimaryContainer,
    },
    body: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.onPrimaryContainer,
      opacity: 0.9,
      marginTop: 2,
    },
    badge: {
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.onPrimaryContainer,
    },
  });
}
