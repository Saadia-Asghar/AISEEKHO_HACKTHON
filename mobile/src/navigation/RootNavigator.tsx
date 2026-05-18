import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { loadStoredUser } from '../storage/userStorage';
import { useUserStore } from '../store/useUserStore';
import { colors } from '../constants/theme';
import ClerkAuthScreen from '../screens/ClerkAuthScreen';
import MainTabNavigator from './MainTabNavigator';
import HomeStackNavigator from './HomeStackNavigator';

export type RootStackParamList = {
  Welcome: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isReady, userId, setUser, setReady } = useUserStore();

  useEffect(() => {
    loadStoredUser()
      .then((u) => {
        if (u) setUser(u.userId, u.displayName);
      })
      .finally(() => setReady(true));
  }, [setUser, setReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userId ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Welcome" component={ClerkAuthScreen} />
      )}
    </Stack.Navigator>
  );
}
