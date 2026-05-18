import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/theme';
import { getSession } from '../lib/auth';

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
    const onAuth = segments[0] === 'auth';
    if (!authed && !onAuth) router.replace('/auth');
    else if (authed && onAuth) router.replace('/');
  }, [ready, authed, segments]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
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
