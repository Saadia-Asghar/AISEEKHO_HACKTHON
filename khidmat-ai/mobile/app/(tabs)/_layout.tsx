import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadows, spacing } from '../../constants/theme';
import { TAB_HINTS } from '../../constants/guide';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: '🏠', Bookings: '📋', Trace: '🧠', Profile: '👤' };
  const hint = TAB_HINTS[label] || '';
  return (
    <View style={[styles.ni, focused && styles.niActive]}>
      <Text style={[styles.icon, focused && styles.iconActive]}>{icons[label] || '•'}</Text>
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
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
  tabBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: Platform.OS === 'ios' ? 20 : 12,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: colors.border2,
    paddingBottom: 8,
    paddingTop: 8,
    ...shadows.card,
  },
  ni: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: radius.lg,
    minWidth: 56,
  },
  niActive: {
    backgroundColor: colors.violetSoft,
  },
  icon: { fontSize: 20, opacity: 0.45 },
  iconActive: { opacity: 1 },
  label: { fontSize: 10, fontWeight: '700', color: colors.text3, fontFamily: fonts.body },
  labelActive: { color: colors.violetBright },
  hint: { fontSize: 8, color: colors.text3, fontFamily: fonts.body },
  hintActive: { color: colors.text2 },
});
