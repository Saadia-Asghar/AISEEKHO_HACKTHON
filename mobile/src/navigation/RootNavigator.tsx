import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { loadAuth, isOnboardingDone } from '../storage/authStorage';
import { useUserStore } from '../store/useUserStore';
import { useThemeStore } from '../hooks/useTheme';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import MainTabNavigator from './MainTabNavigator';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { colors, hydrate: hydrateTheme, ready: themeReady } = useThemeStore();
  const { userId, setUser, setReady } = useUserStore();
  const [phase, setPhase] = useState<'splash' | 'onboarding' | 'auth' | 'main' | 'loading'>('loading');

  const bootstrap = useCallback(async () => {
    await hydrateTheme();
    const auth = await loadAuth();
    const onboarded = await isOnboardingDone();
    if (auth) {
      setUser(auth.userId, auth.name, auth.phone);
      setPhase('main');
    } else if (!onboarded) {
      setPhase('splash');
    } else {
      setPhase('auth');
    }
    setReady(true);
  }, [hydrateTheme, setUser, setReady]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (themeReady && !userId && phase === 'main') {
      setPhase('auth');
    }
  }, [userId, phase, themeReady]);

  if (!themeReady || phase === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (phase === 'splash') {
    return <SplashScreen onDone={() => setPhase('onboarding')} />;
  }

  if (phase === 'onboarding') {
    return <OnboardingScreen onComplete={() => setPhase('auth')} />;
  }

  if (phase === 'auth' || !userId) {
    return <AuthScreen onAuthed={() => setPhase('main')} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
    </Stack.Navigator>
  );
}
