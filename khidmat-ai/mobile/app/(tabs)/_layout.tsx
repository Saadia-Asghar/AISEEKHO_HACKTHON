import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../constants/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: '🏠', Bookings: '📋', Trace: '🧠', Profile: '👤' };
  return (
    <View style={styles.ni}>
      <Text style={[styles.icon, focused && styles.iconActive]}>{icons[label] || '•'}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
      {focused ? <View style={styles.dot} /> : null}
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
    backgroundColor: 'rgba(10,10,15,0.97)',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 8,
  },
  ni: { alignItems: 'center', gap: 4, paddingVertical: 4 },
  icon: { fontSize: 20, opacity: 0.5 },
  iconActive: { opacity: 1 },
  label: { fontSize: 10, fontWeight: '600', color: colors.text3, fontFamily: fonts.body },
  labelActive: { color: colors.violetBright },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.violetBright,
    marginTop: 2,
  },
});
