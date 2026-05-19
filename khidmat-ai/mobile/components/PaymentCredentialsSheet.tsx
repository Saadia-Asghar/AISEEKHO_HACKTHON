import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { PaymentMethod } from '../api/client';
import type { PaymentCredentialsPayload } from '../lib/paymentCredentials';

export type { PaymentCredentialsPayload };
import type { AppColors } from '../constants/theme';
import { fonts, radius, spacing } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';
import { useI18n } from '../lib/i18n';
import Button from './ui/Button';

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatPkPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
}

type Props = {
  visible: boolean;
  method: PaymentMethod;
  amountLabel: string;
  onClose: () => void;
  onSubmit: (credentials: PaymentCredentialsPayload) => void | Promise<void>;
  processing?: boolean;
};

export default function PaymentCredentialsSheet({
  visible,
  method,
  amountLabel,
  onClose,
  onSubmit,
  processing,
}: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => sheetStyles(colors), [colors]);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [cashOk, setCashOk] = useState(false);
  const [localError, setLocalError] = useState('');

  const reset = () => {
    setLocalError('');
    setCardNumber('');
    setCardName('');
    setExpiry('');
    setCvv('');
    setPhone('');
    setPin('');
    setCashOk(false);
  };

  const handleClose = () => {
    if (processing) return;
    reset();
    onClose();
  };

  const validate = (): PaymentCredentialsPayload | null => {
    if (method === 'card') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 16) {
        setLocalError(t('pay_err_card_number'));
        return null;
      }
      if (cardName.trim().length < 2) {
        setLocalError(t('pay_err_card_name'));
        return null;
      }
      if (expiry.length < 5) {
        setLocalError(t('pay_err_expiry'));
        return null;
      }
      if (cvv.replace(/\D/g, '').length < 3) {
        setLocalError(t('pay_err_cvv'));
        return null;
      }
      return {
        kind: 'card',
        card_number: digits,
        cardholder_name: cardName.trim(),
        expiry,
        cvv: cvv.replace(/\D/g, ''),
      };
    }
    if (method === 'jazzcash' || method === 'easypaisa') {
      const p = phone.replace(/\D/g, '');
      if (!/^03\d{9}$/.test(p)) {
        setLocalError(t('pay_err_phone'));
        return null;
      }
      if (pin.replace(/\D/g, '').length < 4) {
        setLocalError(t('pay_err_pin'));
        return null;
      }
      return { kind: 'wallet', phone: p, pin: pin.replace(/\D/g, '') };
    }
    if (!cashOk) {
      setLocalError(t('pay_err_cash'));
      return null;
    }
    return { kind: 'cash', confirmed: true };
  };

  const handleSubmit = async () => {
    setLocalError('');
    const creds = validate();
    if (!creds) return;
    await onSubmit(creds);
  };

  const title =
    method === 'card'
      ? t('pay_cred_card_title')
      : method === 'cash'
        ? t('pay_cred_cash_title')
        : t('pay_cred_wallet_title');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.sub}>{amountLabel}</Text>

            <ScrollView keyboardShouldPersistTaps="handled" style={styles.formScroll}>
              {method === 'card' ? (
                <>
                  <Field
                    label={t('pay_card_number')}
                    value={cardNumber}
                    onChangeText={(v) => setCardNumber(formatCardNumber(v))}
                    placeholder="0000 0000 0000 0000"
                    keyboardType="number-pad"
                    colors={colors}
                  />
                  <Field
                    label={t('pay_card_name')}
                    value={cardName}
                    onChangeText={setCardName}
                    placeholder={t('pay_card_name_ph')}
                    colors={colors}
                  />
                  <View style={styles.row2}>
                    <Field
                      label={t('pay_expiry')}
                      value={expiry}
                      onChangeText={(v) => setExpiry(formatExpiry(v))}
                      placeholder="MM/YY"
                      keyboardType="number-pad"
                      half
                      colors={colors}
                    />
                    <Field
                      label={t('pay_cvv')}
                      value={cvv}
                      onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                      placeholder="•••"
                      secure
                      half
                      colors={colors}
                    />
                  </View>
                </>
              ) : null}

              {method === 'jazzcash' || method === 'easypaisa' ? (
                <>
                  <Field
                    label={t('pay_wallet_phone')}
                    value={phone}
                    onChangeText={(v) => setPhone(formatPkPhone(v))}
                    placeholder="0300 1234567"
                    keyboardType="number-pad"
                    colors={colors}
                  />
                  <Field
                    label={t('pay_wallet_pin')}
                    value={pin}
                    onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••"
                    secure
                    colors={colors}
                  />
                </>
              ) : null}

              {method === 'cash' ? (
                <Pressable style={styles.cashRow} onPress={() => setCashOk((v) => !v)}>
                  <Text style={styles.cashCheck}>{cashOk ? '☑' : '☐'}</Text>
                  <Text style={styles.cashText}>{t('pay_cash_confirm')}</Text>
                </Pressable>
              ) : null}

              {localError ? <Text style={styles.error}>{localError}</Text> : null}
              <Text style={styles.secure}>{t('pay_secure_note')}</Text>
            </ScrollView>

            <Button
              label={processing ? t('pay_processing') : t('pay_submit')}
              onPress={handleSubmit}
              loading={processing}
              style={{ width: '100%', marginTop: spacing.sm }}
            />
            <Pressable onPress={handleClose} style={styles.cancel} disabled={processing}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
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
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  secure?: boolean;
  half?: boolean;
  colors: AppColors;
}) {
  const styles = useMemo(() => sheetStyles(colors), [colors]);
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
        autoCapitalize={label.includes('Name') || label.includes('نام') ? 'words' : 'none'}
      />
    </View>
  );
}

function sheetStyles(colors: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    kav: { width: '100%' },
    sheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      maxHeight: '88%',
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 20,
      fontWeight: '600',
      color: colors.primaryText,
    },
    sub: { fontSize: 13, color: colors.text2, marginTop: 4, marginBottom: spacing.md, fontFamily: fonts.body },
    formScroll: { maxHeight: 340 },
    field: { marginBottom: spacing.md },
    fieldHalf: { flex: 1 },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text2,
      marginBottom: 6,
      fontFamily: fonts.body,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: 14,
      fontSize: 16,
      color: colors.text,
      fontFamily: fonts.body,
    },
    row2: { flexDirection: 'row', gap: spacing.md },
    cashRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: spacing.sm },
    cashCheck: { fontSize: 20, color: colors.violetBright },
    cashText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20, fontFamily: fonts.body },
    error: { color: colors.error, fontSize: 13, marginBottom: spacing.sm, fontFamily: fonts.body },
    secure: { fontSize: 11, color: colors.text3, lineHeight: 16, marginBottom: spacing.md, fontFamily: fonts.body },
    cancel: { alignItems: 'center', paddingVertical: spacing.md },
    cancelText: { color: colors.text2, fontSize: 14, fontFamily: fonts.body },
  });
}
