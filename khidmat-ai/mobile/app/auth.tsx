import { useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../constants/theme';
import { persistSession } from '../lib/auth';
import { sendOtp, verifyAuth } from '../api/client';

export default function AuthScreen() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [digits, setDigits] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRefs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];
  const phone = `+92${phoneDigits}`;

  const requestOtp = async () => {
    if (phoneDigits.length < 10) {
      setError('Enter 10-digit number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendOtp(phone);
      setStep('otp');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    const otp = digits.replace(/\s/g, '').slice(0, 4);
    if (otp.length !== 4) {
      setError('Enter 4-digit OTP (demo: 1234)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await verifyAuth(phone, otp, 'Guest');
      await persistSession({
        token: data.token,
        userId: data.user_id,
        name: data.name || 'Guest',
        phone,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const onOtpChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const arr = digits.padEnd(4, ' ').split('');
    arr[i] = d || ' ';
    const next = arr.join('').trim();
    setDigits(next.replace(/\s/g, '').slice(0, 4));
    if (d && i < 3) otpRefs[i + 1].current?.focus();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.title}>KhidmatAI</Text>
        <Text style={styles.sub}>Sign in with phone · Powered by Google</Text>

        {step === 'phone' ? (
          <>
            <View style={styles.phoneRow}>
              <Text style={styles.flag}>🇵🇰 +92</Text>
              <TextInput
                style={styles.phoneInput}
                keyboardType="number-pad"
                maxLength={10}
                value={phoneDigits}
                onChangeText={(t) => setPhoneDigits(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="3XX XXXXXXX"
                placeholderTextColor={colors.muted}
                editable={!loading}
              />
            </View>
            <Pressable style={[styles.btn, loading && { opacity: 0.5 }]} onPress={requestOtp} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.btnText}>Send OTP</Text>}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.hint}>Demo OTP: 1234</Text>
            <View style={styles.otpRow}>
              {[0, 1, 2, 3].map((i) => (
                <TextInput
                  key={i}
                  ref={otpRefs[i]}
                  style={styles.otpBox}
                  keyboardType="number-pad"
                  maxLength={1}
                  onChangeText={(v) => onOtpChange(i, v)}
                  editable={!loading}
                />
              ))}
            </View>
            <Pressable style={[styles.btn, loading && { opacity: 0.5 }]} onPress={verify} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.btnText}>Verify</Text>}
            </Pressable>
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  sub: { color: colors.muted, textAlign: 'center', marginBottom: spacing.lg },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flag: { fontSize: 16, marginRight: spacing.sm },
  phoneInput: { flex: 1, color: colors.text, fontSize: 18, paddingVertical: spacing.md },
  btn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  btnText: { color: colors.text, fontWeight: '700' },
  hint: { color: colors.muted, marginBottom: spacing.sm },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  otpBox: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 22,
    textAlign: 'center',
    fontWeight: '700',
  },
  error: { color: colors.error, textAlign: 'center', marginTop: spacing.md },
});
