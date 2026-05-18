import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStackNavigator from './HomeStackNavigator';
import BookingsScreen from '../screens/BookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useTheme } from '../hooks/useTheme';
import { useUserStore } from '../store/useUserStore';
import { upcomingCount } from '../api/api';

export type MainTabParamList = {
  BookTab: undefined;
  BookingsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { colors } = useTheme();
  const userId = useUserStore((s) => s.userId);
  const [badge, setBadge] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const refresh = () => upcomingCount(userId).then((r) => setBadge(r.count)).catch(() => setBadge(0));
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [userId]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen name="BookTab" component={HomeStackNavigator} options={{ title: 'Home', tabBarIcon: () => <Text>🏠</Text> }} />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsScreen}
        options={{
          title: 'Bookings',
          tabBarIcon: () => <Text>📋</Text>,
          tabBarBadge: badge > 0 ? badge : undefined,
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitle: 'My bookings',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: () => <Text>👤</Text>,
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
        }}
      />
    </Tab.Navigator>
  );
}
