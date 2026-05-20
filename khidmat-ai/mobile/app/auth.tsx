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
import { useUser } from '@clerk/clerk-expo';
import type { AppColors } from '../constants/theme';
import { fonts, radius, spacing } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';
import ThemedSafeArea from '../components/ThemedSafeArea';
import { persistSession } from '../lib/auth';
import { sendOtp, syncClerkUser, verifyAuth } from '../api/client';
import Button from '../components/ui/Button';
import StitchAppHeader from '../components/stitch/StitchAppHeader';
import StitchGlassCard from '../components/stitch/StitchGlassCard';
import PhoneInputRow from '../components/PhoneInputRow';
import GoogleBadge from '../components/GoogleBadge';
import LanguagePicker from '../components/LanguagePicker';
import { stitchAssets } from '../constants/stitchDesign';
import { showToast } from '../lib/toastStore';
import { useI18n } from '../lib/i18n';
import { isClerkConfigured } from '../lib/clerkConfig';
import { clerkErrorMessage, useClerkPhoneOtp } from '../lib/clerkPhoneOtp';

type AuthMode = 'demo' | 'clerk';

const GUEST_PHONE = '+923000000000';
const DEMO_OTP_LEN = 4;
const CLERK_OTP_LEN = 6;

export default function AuthScreen() {
  if (isClerkConfigured()) {
    return <ClerkAuthScreen />;
  }
  return <MockAuthScreen />;
}

function MockAuthScreen() {
  return <AuthScreenBody useClerk={false} />;
}

function ClerkAuthScreen() {
  const clerkOtp = useClerkPhoneOtp();
  const { user: clerkUser } = useUser();
  return <AuthScreenBody useClerk clerkOtp={clerkOtp} clerkUser={clerkUser} />;
}

type ClerkUser = ReturnType<typeof useUser>['user'];

function AuthScreenBody({
  useClerk,
  clerkOtp,
  clerkUser,
}: {
  useClerk: boolean;
  clerkOtp?: ReturnType<typeof useClerkPhoneOtp>;
  clerkUser?: ClerkUser;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => authStyles(colors), [colors]);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [digits, setDigits] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(useClerk ? 'clerk' : 'demo');

  const otpLen = authMode === 'clerk' ? CLERK_OTP_LEN : DEMO_OTP_LEN;
  const otpRefs = useRef(
    Array.from({ length: CLERK_OTP_LEN }, () => useRef<TextInput>(null)),
  ).current;
  const phone = `+92${phoneDigits}`;

  const requestOtp = async () => {
    if (phoneDigits.length < 10) {
      setError('Enter 10-digit number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (useClerk && phone !== GUEST_PHONE && clerkOtp) {
        if (!clerkOtp.isReady) {
          setError('Clerk is loading — wait a moment');
          return;
        }
        try {
          await clerkOtp.sendCode(phone);
          setAuthMode('clerk');
          setStep('otp');
          setDigits('');
          showToast(t('otp_sent_sms'));
        } catch (clerkErr) {
          const res = await sendOtp(phone);
          setAuthMode('demo');
          setStep('otp');
          setDigits('');
          showToast(res.twilio ? t('otp_sent_sms') : `${t('demo_code')} 1234`);
          setError(
            `Clerk SMS unavailable (${clerkErrorMessage(clerkErr)}). Use demo code 1234 below.`,
          );
        }
      } else {
        const res = await sendOtp(phone);
        setAuthMode('demo');
        setStep('otp');
        setDigits('');
        showToast(res.twilio ? t('otp_sent_sms') : `${t('demo_code')} 1234`);
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      setError(useClerk ? clerkErrorMessage(e) : e instanceof Error ? e.message : 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const finishSession = async (data: {
    token: string;
    user_id: string;
    name: string;
    phone: string;
  }) => {
    await persistSession({
      token: data.token,
      userId: data.user_id,
      name: data.name || 'Guest',
      phone: data.phone,
    });
    showToast('Welcome!');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  const verify = async () => {
    const otp = digits.replace(/\s/g, '').slice(0, otpLen);
    if (otp.length !== otpLen) {
      setError(
        authMode === 'clerk'
          ? t('clerk_otp_hint')
          : 'Enter 4-digit OTP (demo: 1234)',
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (authMode === 'clerk' && clerkOtp) {
        const cid = await clerkOtp.verifyCode(otp);
        const synced = await syncClerkUser({
          clerk_user_id: cid,
          display_name: clerkUser?.fullName || clerkUser?.firstName || 'Guest',
          phone: clerkUser?.primaryPhoneNumber?.phoneNumber ?? phone,
        });
        await finishSession({
          token: synced.token,
          user_id: synced.user_id,
          name: synced.name,
          phone: synced.phone ?? phone,
        });
      } else {
        const data = await verifyAuth(phone, otp, 'Guest');
        await finishSession({
          token: data.token,
          user_id: data.user_id,
          name: data.name,
          phone,
        });
      }
    } catch (e) {
      setError(useClerk && authMode === 'clerk' ? clerkErrorMessage(e) : e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const guestContinue = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendOtp(GUEST_PHONE);
      const data = await verifyAuth(GUEST_PHONE, '1234', 'Guest');
      await finishSession({
        token: data.token,
        user_id: data.user_id,
        name: data.name || 'Guest',
        phone: GUEST_PHONE,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not continue — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const onOtpChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const arr = digits.padEnd(otpLen, ' ').split('');
    while (arr.length < otpLen) arr.push(' ');
    arr[i] = d || ' ';
    const next = arr.join('').trim();
    setDigits(next.replace(/\s/g, '').slice(0, otpLen));
    if (d && i < otpLen - 1) otpRefs[i + 1].current?.focus();
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
                <Button
                  label={t('send_otp')}
                  onPress={requestOtp}
                  loading={loading || !!(useClerk && clerkOtp?.sending)}
                  style={{ width: '100%', marginTop: spacing.md }}
                />
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
                  {Array.from({ length: otpLen }).map((_, i) => (
                    <TextInput
                      key={i}
                      ref={otpRefs[i]}
                      style={[
                        styles.otpBox,
                        otpLen > 4 && styles.otpBoxNarrow,
                        digits.length > i && styles.otpBoxFilled,
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      onChangeText={(v) => onOtpChange(i, v)}
                      editable={!loading}
                    />
                  ))}
                </View>
                {authMode === 'demo' ? (
                  <View style={styles.demoBanner}>
                    <Text style={styles.demoOtp}>
                      {t('demo_code')} <Text style={styles.demoCode}>1234</Text>
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.clerkHint}>{t('clerk_otp_hint')}</Text>
                )}
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
            {useClerk ? <View nativeID="clerk-captcha" style={styles.captcha} /> : null}
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
    clerkHint: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.text2,
      marginBottom: spacing.md,
      fontFamily: fonts.body,
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
    otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: spacing.md },
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
    otpBoxNarrow: { width: 46, fontSize: 20 },
    otpBoxFilled: { borderColor: colors.primaryText },
    demoOtp: { textAlign: 'center', fontSize: 12, color: colors.text3, fontFamily: fonts.body },
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
  captcha: { height: 1, width: 1, opacity: 0, marginTop: 4 },
  });
}
