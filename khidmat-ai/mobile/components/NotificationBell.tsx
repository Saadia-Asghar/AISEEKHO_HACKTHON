import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { fonts, radius } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';
import { useAppNotifications } from '../lib/appNotifications';

export default function NotificationBell({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { colors } = useTheme();
  const styles = useMemo(() => bellStyles(colors, size), [colors, size]);
  const items = useAppNotifications((s) => s.items);
  const hydrated = useAppNotifications((s) => s.hydrated);
  const hydrate = useAppNotifications((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  const unread = items.filter((n) => !n.read).length;

  const openNotifications = () => {
    void hydrate();
    router.push('/notifications');
  };

  return (
    <Pressable
      onPress={openNotifications}
      style={styles.btn}
      accessibilityLabel="Notifications"
      hitSlop={8}
    >
      <Text style={styles.icon}>🔔</Text>
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : String(unread)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Bell + optional settings for app headers */
export function HeaderActions({ onSettings }: { onSettings?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <NotificationBell />
      {onSettings ? (
        <Pressable
          onPress={onSettings}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          accessibilityLabel="Settings"
        >
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function bellStyles(colors: ReturnType<typeof useTheme>['colors'], size: 'sm' | 'md') {
  const dim = size === 'sm' ? 36 : 40;
  return StyleSheet.create({
    btn: {
      width: dim,
      height: dim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: { fontSize: size === 'sm' ? 18 : 20 },
    badge: {
      position: 'absolute',
      top: 2,
      right: 2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.rose,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#fff',
      fontFamily: fonts.body,
    },
  });
}
