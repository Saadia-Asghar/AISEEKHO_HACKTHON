import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
}
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getSessionSafe } from '../lib/authBootstrap';
import { onAuthChange } from '../lib/authEvents';
import AppToast from '../components/AppToast';
import AppNotificationBanner from '../components/AppNotificationBanner';
import { initAppNotifications } from '../lib/appNotifications';
import ClerkProviderGate from '../components/ClerkProviderGate';
import { I18nProvider } from '../lib/i18n';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';

/** Redirect once session is known; never block rendering the route tree. */
function AuthBootstrap() {
  const router = useRouter();
  const segments = useSegments();

  const runGuard = useCallback(async () => {
    const session = await getSessionSafe();
    const onAuth = segments[0] === 'auth';
    if (!session && !onAuth) {
      router.replace('/auth');
    } else if (session && onAuth) {
      router.replace('/(tabs)');
    }
  }, [router, segments]);

  useEffect(() => {
    initAppNotifications();
    void runGuard();
  }, [runGuard]);

  useEffect(() => onAuthChange(() => void runGuard()), [runGuard]);

  return null;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ClerkProviderGate>
        <I18nProvider>
          <AuthBootstrap />
          <ThemedRoot />
        </I18nProvider>
      </ClerkProviderGate>
    </ThemeProvider>
  );
}

function ThemedRoot() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppToast />
      <AppNotificationBanner />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="browse" options={{ title: 'Browse', headerShown: false }} />
        <Stack.Screen name="workers" options={{ title: 'Workers', headerShown: false }} />
        <Stack.Screen name="results" options={{ title: 'Results', headerShown: false }} />
        <Stack.Screen name="payment" options={{ title: 'Payment', headerShown: false }} />
        <Stack.Screen name="payment-success" options={{ title: 'Payment successful', headerShown: false }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications', headerShown: false }} />
        <Stack.Screen name="payment-methods" options={{ title: 'Payment Methods', headerShown: false }} />
        <Stack.Screen name="add-card" options={{ title: 'Add Card', headerShown: false }} />
        <Stack.Screen name="booking-confirm" options={{ title: 'Confirmed', headerShown: false }} />
        <Stack.Screen name="provider/[id]" options={{ title: 'Provider', headerShown: false }} />
        <Stack.Screen name="legal/terms" options={{ title: 'Terms of Service', headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
