import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius, spacing } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';
import { useI18n } from '../lib/i18n';
import { useAppNotifications } from '../lib/appNotifications';

export default function AppNotificationBanner() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const items = useAppNotifications((s) => s.items);
  const hydrated = useAppNotifications((s) => s.hydrated);
  const hydrate = useAppNotifications((s) => s.hydrate);
  const markRead = useAppNotifications((s) => s.markRead);
  const remove = useAppNotifications((s) => s.remove);
  const styles = useMemo(() => bannerStyles(colors), [colors]);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  const latest = items.find((n) => !n.read);
  const unread = items.filter((n) => !n.read).length;

  if (!latest) return null;

  const openInbox = () => {
    void hydrate();
    router.push('/notifications');
  };

  const dismiss = () => {
    remove(latest.id);
  };

  return (
    <View style={[styles.wrap, { top: insets.top + 4 }]}>
      <Pressable style={styles.main} onPress={openInbox}>
        <Text style={styles.icon}>🔔</Text>
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {latest.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {latest.body}
          </Text>
          {unread > 1 ? (
            <Text style={styles.more}>{t('notifications_more').replace('{n}', String(unread - 1))}</Text>
          ) : null}
        </View>
        {unread > 1 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        ) : null}
      </Pressable>
      <Pressable
        style={styles.closeBtn}
        onPress={dismiss}
        hitSlop={12}
        accessibilityLabel={t('dismiss_notification')}
      >
        <Text style={styles.closeIcon}>✕</Text>
      </Pressable>
    </View>
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
      backgroundColor: colors.violet,
      borderRadius: radius.lg,
      paddingRight: 4,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    main: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: spacing.md,
      paddingRight: spacing.sm,
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
    more: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.onPrimaryContainer,
      opacity: 0.85,
      marginTop: 4,
      fontWeight: '600',
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
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 4,
    },
    closeIcon: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.onPrimaryContainer,
      opacity: 0.95,
    },
  });
}
