import { useMemo, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { AppColors } from '../constants/theme';
import { fonts, radius, spacing } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';
import ThemedSafeArea from '../components/ThemedSafeArea';
import { persistSession } from '../lib/auth';
import { sendOtp, verifyAuth } from '../api/client';
import Button from '../components/ui/Button';
import StitchAppHeader from '../components/stitch/StitchAppHeader';
import StitchGlassCard from '../components/stitch/StitchGlassCard';
import PhoneInputRow from '../components/PhoneInputRow';
import GoogleBadge from '../components/GoogleBadge';
import LanguagePicker from '../components/LanguagePicker';
import { stitchAssets } from '../constants/stitchDesign';
import { showToast } from '../lib/toastStore';
import { useI18n } from '../lib/i18n';

export default function AuthScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => authStyles(colors), [colors]);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [digits, setDigits] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRefs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];
  const confirmationRef = useRef<any>(null);
  const phone = `+92${phoneDigits}`;

  const requestOtp = async () => {
    if (phoneDigits.length < 10) {
      setError('Enter 10-digit number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Try real native Firebase Phone Authentication first
      try {
        const firebaseAuth = require('@react-native-firebase/auth').default;
        const confirmation = await firebaseAuth().signInWithPhoneNumber(phone);
        confirmationRef.current = confirmation;
        setStep('otp');
        showToast('SMS verification sent via Firebase!');
      } catch (fbError) {
        // 2. Gracefully fall back to backend simulated OTP to avoid Expo Go/Web crashes
        const res = await sendOtp(phone);
        setStep('otp');
        showToast(res.twilio ? t('otp_sent_sms') : `${t('demo_code')} 1234`);
      }
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
      if (confirmationRef.current) {
        // 1. Verify OTP securely via Firebase
        const userCredential = await confirmationRef.current.confirm(otp);
        const fbUser = userCredential.user;
        const data = await verifyAuth(phone, otp, fbUser.displayName || 'Guest');
        await persistSession({
          token: data.token,
          userId: data.user_id,
          name: data.name || 'Guest',
          phone,
        });
      } else {
        // 2. Standard simulated verification fallback
        const data = await verifyAuth(phone, otp, 'Guest');
        await persistSession({
          token: data.token,
          userId: data.user_id,
          name: data.name || 'Guest',
          phone,
        });
      }
      showToast(`Welcome!`);
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
      showToast('Welcome! Tap ❓ on Home for a tour');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not continue — is the backend running?');
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
    <ThemedSafeArea edges={['top', 'bottom']}>
      <StitchAppHeader />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>✨</Text>
            </View>
            <Text style={styles.welcome}>Welcome Back</Text>
            <Text style={styles.welcomeSub}>Premium service execution at your command.</Text>
          </View>

          <LanguagePicker />

          <StitchGlassCard style={styles.cardPad}>
            {step === 'phone' ? (
              <>
                <Text style={styles.label}>{t('mobile_number').toUpperCase()}</Text>
                <PhoneInputRow
                  value={phoneDigits}
                  onChangeText={setPhoneDigits}
                  editable={!loading}
                />
                <Button label={t('send_otp')} onPress={requestOtp} loading={loading} style={{ width: '100%', marginTop: spacing.md }} />
                <View style={styles.divider}>
                  <View style={styles.divLine} />
                  <Text style={styles.divText}>{t('or')}</Text>
                  <View style={styles.divLine} />
                </View>
                <Button
                  label={t('skip_guest')}
                  variant="outline"
                  onPress={guestContinue}
                  loading={loading}
                  disabled={loading}
                  style={{ width: '100%' }}
                />
              </>
            ) : (
              <>
                <Text style={styles.otpTitle}>{t('enter_otp')}</Text>
                <Text style={styles.otpSent}>
                  Sent to <Text style={styles.otpPhone}>+92 {phoneDigits}</Text>
                </Text>
                <View style={styles.otpRow}>
                  {[0, 1, 2, 3].map((i) => (
                    <TextInput
                      key={i}
                      ref={otpRefs[i]}
                      style={[styles.otpBox, digits.length > i && styles.otpBoxFilled]}
                      keyboardType="number-pad"
                      maxLength={1}
                      onChangeText={(v) => onOtpChange(i, v)}
                      editable={!loading}
                    />
                  ))}
                </View>
                <View style={styles.demoBanner}>
                  <Text style={styles.demoOtp}>
                    {t('demo_code')} <Text style={styles.demoCode}>1234</Text>
                  </Text>
                </View>
                <Button
                  label={t('verify_continue')}
                  variant="violet"
                  onPress={verify}
                  loading={loading}
                  style={{ width: '100%' }}
                />
                <Pressable
                  onPress={() => {
                    setStep('phone');
                    setDigits('');
                    setError(null);
                  }}
                  style={styles.linkBtn}
                >
                  <Text style={styles.linkText}>{t('change_number')}</Text>
                </Pressable>
              </>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </StitchGlassCard>

          <View style={styles.heroImageWrap}>
            <Image source={{ uri: stitchAssets.authHero }} style={styles.heroImage} resizeMode="cover" />
          </View>
          <GoogleBadge />
          <Text style={styles.termsLine}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink} onPress={() => router.push('/legal/terms')}>
              Terms of Service
            </Text>
            .
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeArea>
  );
}

function authStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  brandBlock: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.lg },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoIcon: { fontSize: 36 },
  welcome: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  welcomeSub: { fontSize: 16, color: colors.text2, textAlign: 'center', fontFamily: fonts.body },
  cardPad: { padding: spacing.lg, marginBottom: spacing.lg },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text2,
    marginBottom: spacing.sm,
    letterSpacing: 0.8,
    fontFamily: fonts.body,
  },
  demoBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border2,
  },
  heroImageWrap: {
    height: 160,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroImage: { width: '100%', height: '100%' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: spacing.md },
  divLine: { flex: 1, height: 1, backgroundColor: colors.border },
  divText: { fontSize: 12, color: colors.text3, fontFamily: fonts.body },
  otpTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  otpSent: { fontSize: 13, color: colors.text2, marginBottom: spacing.lg, fontFamily: fonts.body },
  otpPhone: { color: colors.text, fontWeight: '600' },
  otpRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: spacing.md },
  otpBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.bgLowest,
    borderWidth: 2,
    borderColor: colors.border2,
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: fonts.display,
  },
  otpBoxFilled: { borderColor: colors.primaryText },
  demoOtp: { textAlign: 'center', fontSize: 12, color: colors.text3, marginBottom: spacing.md, fontFamily: fonts.body },
  demoCode: { color: colors.primaryText, fontWeight: '700', letterSpacing: 3 },
  linkBtn: { alignItems: 'center', padding: spacing.sm },
  linkText: { color: colors.primaryText, fontSize: 14, fontWeight: '600', fontFamily: fonts.body },
  error: { color: colors.rose, textAlign: 'center', marginTop: spacing.md, fontFamily: fonts.body },
  termsLine: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.text3,
    marginTop: spacing.md,
    lineHeight: 18,
    fontFamily: fonts.body,
  },
  termsLink: { color: colors.primaryText, fontWeight: '600', textDecorationLine: 'underline' },
  });
}
