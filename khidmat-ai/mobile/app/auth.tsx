import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { persistSession, saveSession } from '../lib/auth';
import { sendOtp, verifyAuth } from '../api/client';
import Button from '../components/ui/Button';
import GoogleBadge from '../components/GoogleBadge';

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

  const guestContinue = async () => {
    const guestPhone = '+923000000000';
    setLoading(true);
    setError(null);
    try {
      await sendOtp(guestPhone);
      const data = await verifyAuth(guestPhone, '1234', 'Guest');
      await persistSession({
        token: data.token,
        userId: data.user_id,
        name: data.name || 'Guest',
        phone: guestPhone,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not continue as guest — is the backend running?');
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
      <View style={styles.glow} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.authIcon}>
              <Text style={styles.authIconText}>⚡</Text>
            </View>
            <Text style={styles.brand}>KhidmatAI</Text>
            <Text style={styles.tagline}>Bolein, Hum Karein</Text>
            <Text style={styles.authHint}>
              Sign in with OTP or continue as Guest · Demo OTP: 1234
            </Text>
          </View>

          <View style={styles.stepDots}>
            <View style={[styles.sd, step === 'phone' && styles.sdOn]} />
            <View style={[styles.sd, step === 'otp' && styles.sdOn]} />
          </View>

          {step === 'phone' ? (
            <View style={styles.body}>
              <View style={styles.authCard}>
                <Text style={styles.fieldLabel}>📱 Mobile Number</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.phoneCc}>
                    <Text style={styles.phoneCcText}>🇵🇰 +92</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    keyboardType="number-pad"
                    maxLength={10}
                    value={phoneDigits}
                    onChangeText={(t) => setPhoneDigits(t.replace(/\D/g, '').slice(0, 10))}
                    placeholder="3XX XXXXXXX"
                    placeholderTextColor={colors.text3}
                    editable={!loading}
                  />
                </View>
              </View>
              <Button label="Send OTP →" onPress={requestOtp} loading={loading} style={{ width: '100%' }} />
              <View style={styles.divider}>
                <View style={styles.divLine} />
                <Text style={styles.divText}>or</Text>
                <View style={styles.divLine} />
              </View>
              <Button
                label="Continue as Guest"
                variant="outline"
                onPress={guestContinue}
                loading={loading}
                disabled={loading}
                style={{ width: '100%' }}
              />
            </View>
          ) : (
            <View style={styles.body}>
              <Text style={styles.otpSent}>
                OTP sent to <Text style={styles.otpPhone}>+92 {phoneDigits}</Text>
              </Text>
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
              <Text style={styles.demoOtp}>
                Demo OTP: <Text style={styles.demoOtpCode}>1234</Text>
              </Text>
              <Button label="✓ Verify & Continue" variant="jade" onPress={verify} loading={loading} style={{ width: '100%' }} />
              <Pressable onPress={() => setStep('phone')} style={styles.resend}>
                <Text style={styles.resendText}>← Resend OTP</Text>
              </Pressable>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <GoogleBadge />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  glow: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.violetGlow,
    opacity: 0.5,
  },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  logoWrap: { paddingTop: 40, paddingHorizontal: 28, alignItems: 'center' },
  authIcon: {
    width: 76,
    height: 76,
    backgroundColor: colors.violet,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  authIconText: { fontSize: 34 },
  brand: {
    fontFamily: fonts.display,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  tagline: { color: colors.text2, fontSize: 14, fontStyle: 'italic', fontFamily: fonts.body },
  authHint: {
    color: colors.text3,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: spacing.md,
    lineHeight: 18,
    fontFamily: fonts.body,
  },
  stepDots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginVertical: 20 },
  sd: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border2 },
  sdOn: { width: 20, backgroundColor: colors.violet },
  body: { paddingHorizontal: spacing.lg },
  authCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 12,
  },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.text2, marginBottom: 10, fontFamily: fonts.body },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  phoneCc: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: radius.r,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  phoneCcText: { fontSize: 15, fontWeight: '600', color: colors.text, fontFamily: fonts.body },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.r,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.body,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: colors.border },
  divText: { fontSize: 12, color: colors.text3, fontFamily: fonts.body },
  otpSent: { fontSize: 14, color: colors.text2, textAlign: 'center', marginBottom: 18, fontFamily: fonts.body },
  otpPhone: { color: colors.text, fontWeight: '600' },
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 10 },
  otpBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border2,
    borderRadius: radius.r,
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: fonts.display,
  },
  demoOtp: { textAlign: 'center', fontSize: 12, color: colors.text3, marginBottom: 8, fontFamily: fonts.body },
  demoOtpCode: { color: colors.violetBright, fontWeight: '700', letterSpacing: 4, fontFamily: fonts.display },
  resend: { marginTop: 8, alignItems: 'center', padding: spacing.sm },
  resendText: { color: colors.text3, fontSize: 13, fontFamily: fonts.body },
  error: { color: colors.rose, textAlign: 'center', marginTop: spacing.md, fontFamily: fonts.body },
});
