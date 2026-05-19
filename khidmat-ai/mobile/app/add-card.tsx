import { useMemo, useState } from 'react';
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
import { colors, fonts, radius, spacing } from '../constants/theme';
import StitchAppHeader from '../components/stitch/StitchAppHeader';
import { addSavedCard } from '../lib/paymentMethods';
import { showToast } from '../lib/toastStore';

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function AddCardScreen() {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saving, setSaving] = useState(false);

  const previewNumber = useMemo(() => {
    const digits = number.replace(/\D/g, '');
    if (!digits) return '•••• •••• •••• ••••';
    const padded = digits.padEnd(16, '•');
    return formatCardNumber(padded);
  }, [number]);

  const onSave = async () => {
    const digits = number.replace(/\D/g, '');
    if (digits.length < 16 || !name.trim() || expiry.length < 5 || cvv.length < 3) {
      showToast('Please fill in all card details');
      return;
    }
    setSaving(true);
    try {
      const brand = digits.startsWith('4') ? 'visa' : 'mastercard';
      await addSavedCard({
        brand,
        last4: digits.slice(-4),
        expiry,
      });
      showToast('Card saved');
      router.back();
    } catch {
      showToast('Could not save card');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StitchAppHeader title="Add New Card" onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={['#2a2a2c', '#1c1b1d', '#131315']} style={styles.cardPreview}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.cardBrand}>KHIDMAT AI PREMIUM</Text>
                <View style={styles.chip}>
                  <Text style={styles.chipIcon}>📶</Text>
                </View>
              </View>
              <View style={styles.cardLogo} />
            </View>
            <Text style={styles.cardNumber}>{previewNumber}</Text>
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.cardFieldLabel}>Card Holder</Text>
                <Text style={styles.cardFieldValue}>{name.trim() || 'NAME ON CARD'}</Text>
              </View>
              <View style={styles.cardExpiryCol}>
                <Text style={styles.cardFieldLabel}>Expiry</Text>
                <Text style={styles.cardFieldValue}>{expiry || 'MM/YY'}</Text>
              </View>
            </View>
          </LinearGradient>

          <Pressable style={styles.scanBtn} onPress={() => showToast('Card scan coming soon')}>
            <Text style={styles.scanIcon}>💳</Text>
            <Text style={styles.scanLabel}>Scan Card for Quick Entry</Text>
          </Pressable>

          <View style={styles.form}>
            <Field label="Card Number" value={number} onChangeText={(t) => setNumber(formatCardNumber(t))} keyboardType="number-pad" placeholder="0000 0000 0000 0000" secure={false} />
            <Field label="Cardholder Name" value={name} onChangeText={setName} placeholder="John Doe" />
            <View style={styles.row2}>
              <Field label="Expiry Date" value={expiry} onChangeText={(t) => setExpiry(formatExpiry(t))} placeholder="MM/YY" keyboardType="number-pad" half />
              <Field label="CVV" value={cvv} onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))} placeholder="•••" secure half />
            </View>
          </View>

          <View style={styles.badges}>
            {['PCI-DSS', 'SSL Secure', 'Encrypted'].map((b) => (
              <View key={b} style={styles.badge}>
                <Text style={styles.badgeIcon}>✓</Text>
                <Text style={styles.badgeLabel}>{b}</Text>
              </View>
            ))}
          </View>

          <Pressable style={[styles.saveBtn, saving && styles.saveDisabled]} onPress={onSave} disabled={saving}>
            <Text style={styles.saveLabel}>{saving ? 'Saving…' : 'Save Card'}</Text>
          </Pressable>

          <Text style={styles.footer}>Powered by Google</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secure,
  half,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  secure?: boolean;
  half?: boolean;
}) {
  return (
    <View style={[styles.field, half && styles.fieldHalf]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize={label.includes('Name') ? 'words' : 'none'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  cardPreview: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    aspectRatio: 1.58,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.lg,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardBrand: { fontSize: 10, letterSpacing: 1, color: colors.text2, opacity: 0.6, fontFamily: fonts.body },
  chip: {
    marginTop: spacing.md,
    width: 48,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIcon: { fontSize: 18 },
  cardLogo: {
    width: 48,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardNumber: {
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: 2,
    color: colors.text,
    marginVertical: spacing.md,
  },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardExpiryCol: { alignItems: 'flex-end' },
  cardFieldLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: colors.text2,
    opacity: 0.6,
    fontFamily: fonts.body,
  },
  cardFieldValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: 2,
    fontFamily: fonts.body,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.surfaceLow,
    marginBottom: spacing.lg,
  },
  scanIcon: { fontSize: 18 },
  scanLabel: { fontSize: 14, fontWeight: '500', color: colors.primaryText, fontFamily: fonts.body },
  form: { gap: spacing.md },
  field: { gap: 6 },
  fieldHalf: { flex: 1 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
    marginLeft: 4,
    fontFamily: fonts.body,
  },
  input: {
    backgroundColor: colors.bgLowest,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.body,
  },
  row2: { flexDirection: 'row', gap: spacing.md },
  badges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    opacity: 0.65,
  },
  badge: { alignItems: 'center', gap: 4 },
  badgeIcon: { fontSize: 18, color: colors.primaryText },
  badgeLabel: { fontSize: 11, color: colors.text2, fontFamily: fonts.body },
  saveBtn: {
    backgroundColor: colors.violet,
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
    shadowColor: colors.violet,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  saveDisabled: { opacity: 0.7 },
  saveLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onPrimaryContainer,
    fontFamily: fonts.display,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.text3,
    marginTop: spacing.lg,
    fontFamily: fonts.body,
  },
});
