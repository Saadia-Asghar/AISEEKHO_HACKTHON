import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { syncClerkUser } from '../api/client';
import { saveStoredUser } from '../storage/userStorage';
import { useUserStore } from '../store/useUserStore';
import { colors } from '../constants/theme';
import WelcomeScreen from './WelcomeScreen';

export default function ClerkAuthScreen() {
  if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <WelcomeScreen />;
  }
  return <PhoneOtpAuth />;
}

function PhoneOtpAuth() {
  const insets = useSafeAreaInsets();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signUp } = useSignUp();
  const setUser = useUserStore((s) => s.setUser);
  const [phone, setPhone] = useState('+92');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const finishSync = async (clerkUserId: string, name: string, phoneNumber?: string) => {
    const res = await syncClerkUser(clerkUserId, name, phoneNumber);
    await saveStoredUser(res.user_id, res.display_name);
    setUser(res.user_id, res.display_name, phoneNumber);
  };

  const sendCode = async () => {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError(null);
    try {
      await signIn.create({ identifier: phone.trim(), strategy: 'phone_code' });
      const { supportedFirstFactors } = signIn;
      const phoneFactor = supportedFirstFactors?.find((f) => f.strategy === 'phone_code');
      if (phoneFactor && 'phoneNumberId' in phoneFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'phone_code',
          phoneNumberId: phoneFactor.phoneNumberId,
        });
      }
      setCodeSent(true);
    } catch {
      try {
        if (signUp) {
          await signUp.create({ phoneNumber: phone.trim() });
          await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
          setCodeSent(true);
        }
      } catch (e2) {
        setError(e2 instanceof Error ? e2.message : 'Could not send OTP. Enable Phone in Clerk Dashboard.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError(null);
    try {
      let sessionId: string | null = null;
      if (signIn?.status === 'needs_first_factor') {
        const attempt = await signIn.attemptFirstFactor({ strategy: 'phone_code', code });
        sessionId = attempt.createdSessionId;
      } else if (signUp?.status === 'missing_requirements' || signUp?.status === 'complete') {
        const attempt = await signUp.attemptPhoneNumberVerification({ code });
        sessionId = attempt.createdSessionId;
      }
      if (sessionId && setActive) {
        await setActive({ session: sessionId });
        const clerkUser = signIn?.userId || signUp?.createdUserId;
        if (clerkUser) {
          await finishSync(clerkUser, 'KhidmatAI User', phone);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + 20 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <Text style={styles.title}>Sign in with phone</Text>
      <Text style={styles.subtitle}>Clerk OTP — same flow as Mahir / Urban Company</Text>

      {!codeSent ? (
        <>
          <Text style={styles.label}>Phone (E.164, e.g. +923001234567)</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+92..."
            placeholderTextColor={colors.dim}
          />
          <Pressable style={styles.button} onPress={sendCode} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Send OTP</Text>}
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>Enter verification code</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            placeholder="123456"
            placeholderTextColor={colors.dim}
            maxLength={6}
          />
          <Pressable style={styles.button} onPress={verifyCode} disabled={loading || code.length < 4}>
            {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Verify & continue</Text>}
          </Pressable>
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.guest} onPress={() => setPending(true)}>
        <Text style={styles.guestText}>Continue without Clerk (demo name)</Text>
      </Pressable>
      {pending ? <WelcomeScreen /> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.muted, marginTop: 8, marginBottom: 20 },
  label: { color: colors.dim, marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: { color: colors.bg, fontWeight: '700' },
  error: { color: colors.error, marginTop: 12 },
  guest: { marginTop: 24, alignItems: 'center' },
  guestText: { color: colors.dim, textDecorationLine: 'underline' },
});
