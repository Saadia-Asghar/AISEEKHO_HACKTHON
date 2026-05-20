import { useEffect, useState } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { getSessionSafe } from '../../lib/authBootstrap';
import { onAuthChange } from '../../lib/authEvents';
import { MaterialIcons } from '@expo/vector-icons';
import { fonts, radius, shadows, spacing } from '../../constants/theme';
import { useTheme } from '../../lib/ThemeContext';
import { useI18n } from '../../lib/i18n';

const TAB_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Home: 'home',
  Bookings: 'calendar-month',
  Trace: 'my-location',
  Profile: 'person',
};

type TabKey = 'home' | 'bookings' | 'trace' | 'profile';

const TAB_LABEL_KEY: Record<TabKey, 'tab_home' | 'tab_bookings' | 'tab_trace' | 'tab_profile'> = {
  home: 'tab_home',
  bookings: 'tab_bookings',
  trace: 'tab_trace',
  profile: 'tab_profile',
};

const TAB_HINT_KEY: Record<TabKey, 'tab_hint_home' | 'tab_hint_bookings' | 'tab_hint_trace' | 'tab_hint_profile'> = {
  home: 'tab_hint_home',
  bookings: 'tab_hint_bookings',
  trace: 'tab_hint_trace',
  profile: 'tab_hint_profile',
};

const TAB_ICON_KEY: Record<TabKey, keyof typeof TAB_ICONS> = {
  home: 'Home',
  bookings: 'Bookings',
  trace: 'Trace',
  profile: 'Profile',
};

function TabIcon({ tab, focused }: { tab: TabKey; focused: boolean }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const label = t(TAB_LABEL_KEY[tab]);
  const hint = t(TAB_HINT_KEY[tab]);
  const iconName = TAB_ICONS[TAB_ICON_KEY[tab]] ?? 'circle';
  const styles = makeTabStyles(colors);

  return (
    <View style={[styles.ni, focused && styles.niActive]}>
      {focused ? <View style={styles.tabIndicator} /> : null}
      <MaterialIcons
        name={iconName}
        size={24}
        color={focused ? colors.primaryText : colors.text3}
      />
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
      {hint ? (
        <Text style={[styles.hint, focused && styles.hintActive]} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => getSessionSafe().then((s) => setHasSession(!!s));
    check();
    return onAuthChange(check);
  }, []);

  if (hasSession === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primaryText} />
      </View>
    );
  }
  if (!hasSession) return <Redirect href="/auth" />;

  const tabBarStyle = {
    ...styles.tabBarBase,
    backgroundColor: colors.tabBar,
    borderColor: colors.border2,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.violetBright,
        tabBarInactiveTintColor: colors.text3,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_home'),
          tabBarIcon: ({ focused }) => <TabIcon tab="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('tab_bookings'),
          tabBarIcon: ({ focused }) => <TabIcon tab="bookings" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="trace"
        options={{
          title: t('tab_trace'),
          tabBarIcon: ({ focused }) => <TabIcon tab="trace" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab_profile'),
          tabBarIcon: ({ focused }) => <TabIcon tab="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    paddingTop: 8,
    zIndex: 100,
    elevation: 24,
    ...shadows.card,
  },
});

function makeTabStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    ni: {
      alignItems: 'center',
      gap: 2,
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: radius.lg,
      minWidth: 64,
      position: 'relative',
    },
    tabIndicator: {
      position: 'absolute',
      top: 0,
      width: 28,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.violet,
    },
    niActive: {
      backgroundColor: colors.violetSoft,
    },
    label: { fontSize: 10, fontWeight: '700', color: colors.text3, fontFamily: fonts.body },
    labelActive: { color: colors.primaryText },
    hint: { fontSize: 8, color: colors.text3, fontFamily: fonts.body, maxWidth: 72, textAlign: 'center' },
    hintActive: { color: colors.text2 },
  });
}
