import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import StitchLoadingOverlay from '../components/stitch/StitchLoadingOverlay';

if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
}
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getSession } from '../lib/auth';
import AppToast from '../components/AppToast';
import { I18nProvider } from '../lib/i18n';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    getSession().then((s) => {
      setAuthed(!!s);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    (async () => {
      const session = await getSession();
      if (cancelled) return;
      setAuthed(!!session);
      const onAuth = segments[0] === 'auth';
      if (!session && !onAuth) router.replace('/auth');
      else if (session && onAuth) router.replace('/');
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, segments, router]);

  if (!ready) {
    return (
      <ThemeProvider>
        <BootSplash />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <I18nProvider>
        <ThemedRoot authed={authed} />
      </I18nProvider>
    </ThemeProvider>
  );
}

function BootSplash() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StitchLoadingOverlay visible subtitle="Starting KhidmatAI…" />
    </View>
  );
}

function ThemedRoot({ authed: _authed }: { authed: boolean }) {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppToast />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="browse" options={{ title: 'Browse', headerShown: false }} />
        <Stack.Screen name="workers" options={{ title: 'Workers', headerShown: false }} />
        <Stack.Screen name="results" options={{ title: 'Results', headerShown: false }} />
        <Stack.Screen name="payment" options={{ title: 'Payment', headerShown: false }} />
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
