import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
}
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/theme';
import { getSession } from '../lib/auth';
import AppToast from '../components/AppToast';

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
  }, [ready, segments]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.violet} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
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
        <Stack.Screen name="results" options={{ title: 'Results' }} />
        <Stack.Screen name="booking-confirm" options={{ title: 'Confirmed', headerShown: false }} />
        <Stack.Screen name="provider/[id]" options={{ title: 'Provider' }} />
      </Stack>
    </>
  );
}
