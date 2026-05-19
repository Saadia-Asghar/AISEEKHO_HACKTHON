import { useEffect, useState } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { getSession } from '../../lib/auth';
import { onAuthChange } from '../../lib/authEvents';
import { MaterialIcons } from '@expo/vector-icons';
import { fonts, radius, shadows, spacing } from '../../constants/theme';
import { TAB_HINTS } from '../../constants/guide';
import { useTheme } from '../../lib/ThemeContext';

const TAB_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Home: 'home',
  Bookings: 'calendar-month',
  Trace: 'my-location',
  Profile: 'person',
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const { colors } = useTheme();
  const hint = TAB_HINTS[label] || '';
  const iconName = TAB_ICONS[label] ?? 'circle';
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
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => getSession().then((s) => setHasSession(!!s));
    check();
    return onAuthChange(check);
  }, []);

  if (hasSession === null) return null;
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
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ focused }) => <TabIcon label="Bookings" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="trace"
        options={{
          title: 'Trace',
          tabBarIcon: ({ focused }) => <TabIcon label="Trace" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
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
