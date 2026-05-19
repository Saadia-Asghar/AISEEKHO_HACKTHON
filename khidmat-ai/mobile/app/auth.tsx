import { useRef, useState } from 'react';
import {
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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, gradients, radius, spacing } from '../constants/theme';
import { persistSession } from '../lib/auth';
import { sendOtp, verifyAuth } from '../api/client';
import Button from '../components/ui/Button';
import CurvedSheet from '../components/ui/CurvedSheet';
import SegmentedControl from '../components/ui/SegmentedControl';
import InputField from '../components/ui/InputField';
import GoogleBadge from '../components/GoogleBadge';
import { showToast } from '../lib/toastStore';
import { useI18n } from '../lib/i18n';
import LanguagePicker from '../components/LanguagePicker';

type AuthTab = 'phone' | 'otp';

export default function AuthScreen() {
  const { t } = useI18n();
  const [tab, setTab] = useState<AuthTab>('phone');
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
      const res = await sendOtp(phone);
      setTab('otp');
      showToast(res.twilio ? t('otp_sent_sms') : `${t('demo_code')} 1234`);
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
      showToast(`Welcome, ${data.name || 'Guest'}!`);
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient colors={[...gradients.hero]} style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>⚡</Text>
          </View>
          <Text style={styles.welcome}>{t('welcome')}</Text>
          <Text style={styles.heroSub}>{t('auth_sub')}</Text>
        </LinearGradient>

        <CurvedSheet>
          <ScrollView contentContainerStyle={styles.sheetScroll} keyboardShouldPersistTaps="handled">
            <LanguagePicker />
            <SegmentedControl
              options={[
                { key: 'phone' as const, label: 'Phone' },
                { key: 'otp' as const, label: 'OTP' },
              ]}
              value={tab}
              onChange={(k) => {
                setTab(k);
                setError(null);
              }}
            />

            {tab === 'phone' ? (
              <>
                <InputField
                  label="Mobile number"
                  icon="📱"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phoneDigits}
                  onChangeText={(t) => setPhoneDigits(t.replace(/\D/g, '').slice(0, 10))}
                  placeholder="3XX XXXXXXX"
                  editable={!loading}
                />
                <Text style={styles.prefix}>{t('country_code')}</Text>
                <Button label={t('send_otp')} onPress={requestOtp} loading={loading} style={{ width: '100%' }} />
                <View style={styles.divider}>
                  <View style={styles.divLine} />
                  <Text style={styles.divText}>{t('or')}</Text>
                  <View style={styles.divLine} />
                </View>
                <Button
                  label="Skip — Continue as Guest"
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
                  Sent to <Text style={styles.otpPhone}>+92 {phoneDigits || '3XX XXXXXXX'}</Text>
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
                  {t('demo_code')} <Text style={styles.demoCode}>1234</Text>
                </Text>
                <Button label={t('verify_continue')} variant="jade" onPress={verify} loading={loading} style={{ width: '100%' }} />
                <Pressable
                  onPress={() => {
                    setTab('phone');
                    setError(null);
                  }}
                  style={styles.linkBtn}
                >
                  <Text style={styles.linkText}>{t('change_number')}</Text>
                </Pressable>
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <GoogleBadge />
          </ScrollView>
        </CurvedSheet>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.violetDeep },
  hero: {
    paddingTop: spacing.lg,
    paddingBottom: 48,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoEmoji: { fontSize: 40 },
  welcome: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontFamily: fonts.body,
    paddingHorizontal: spacing.md,
  },
  sheetScroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  prefix: { fontSize: 11, color: colors.text3, marginTop: -8, marginBottom: spacing.md, fontFamily: fonts.body },
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
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border2,
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: fonts.display,
  },
  demoOtp: { textAlign: 'center', fontSize: 12, color: colors.text3, marginBottom: spacing.md, fontFamily: fonts.body },
  demoCode: { color: colors.violetBright, fontWeight: '700', letterSpacing: 3 },
  linkBtn: { alignItems: 'center', padding: spacing.sm },
  linkText: { color: colors.violetBright, fontSize: 14, fontWeight: '600', fontFamily: fonts.body },
  error: { color: colors.rose, textAlign: 'center', marginTop: spacing.md, fontFamily: fonts.body },
});
