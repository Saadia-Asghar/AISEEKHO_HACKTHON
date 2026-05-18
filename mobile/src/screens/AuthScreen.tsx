import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import HazirLogo from '../components/HazirLogo';
import HapticPressable from '../components/HapticPressable';
import { BRAND, TAGLINE, FONT_BOLD, FONT_REGULAR, RADIUS_XL } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { sendOtp, verifyOtp } from '../api/api';
import { saveAuth } from '../storage/authStorage';
import { useUserStore } from '../store/useUserStore';

type Props = { onAuthed: () => void };

export default function PhoneAuthScreen({ onAuthed }: Props) {
  const { colors } = useTheme();
  const setUser = useUserStore((s) => s.setUser);
  const [phone, setPhone] = useState('+92');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendOtp(phone);
      setStep('otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (otp.length !== 4) {
      setError('Enter 4-digit code (demo: 1234)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await verifyOtp(phone, otp, name || undefined);
      await saveAuth({
        token: res.token,
        userId: res.user_id,
        name: res.user.name,
        phone: res.user.phone || phone,
      });
      const lang = res.user.language_pref === 'en' ? 'en' : 'ur';
      setUser(res.user_id, res.user.name, res.user.phone || phone, lang);
      onAuthed();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <HazirLogo size={72} />
      <Text style={[styles.brand, { color: colors.text, fontFamily: FONT_BOLD }]}>{BRAND}</Text>
      <Text style={[styles.tag, { color: colors.muted, fontFamily: FONT_REGULAR }]}>{TAGLINE}</Text>

      {step === 'phone' ? (
        <>
          <Text style={[styles.label, { color: colors.dim }]}>Your name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={colors.muted}
          />
          <Text style={[styles.label, { color: colors.dim }]}>Phone number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+92 3XX XXXXXXX"
            placeholderTextColor={colors.muted}
          />
          <HapticPressable
            haptic="medium"
            style={[styles.btn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={onSendOtp}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Send OTP</Text>}
          </HapticPressable>
        </>
      ) : (
        <>
          <Text style={[styles.hint, { color: colors.muted }]}>Demo OTP: 1234</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="4-digit code"
            placeholderTextColor={colors.muted}
          />
          <HapticPressable
            haptic="success"
            style={[styles.btn, { backgroundColor: colors.accent }]}
            onPress={onVerify}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Verify & continue</Text>}
          </HapticPressable>
        </>
      )}
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  brand: { fontSize: 28, fontWeight: '800', marginTop: 16 },
  tag: { fontSize: 14, marginBottom: 28, textAlign: 'center' },
  label: { alignSelf: 'stretch', marginBottom: 6, fontSize: 13 },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: RADIUS_XL,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  btn: {
    alignSelf: 'stretch',
    width: '100%',
    padding: 16,
    borderRadius: RADIUS_XL,
    alignItems: 'center',
    marginTop: 8,
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  btnText: { color: '#FFF', fontWeight: '700', fontFamily: FONT_BOLD },
  hint: { alignSelf: 'stretch', marginBottom: 8, fontSize: 13 },
  error: { marginTop: 12, textAlign: 'center' },
});
