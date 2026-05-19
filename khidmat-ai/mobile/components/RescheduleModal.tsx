import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '../constants/theme';
import { fonts, radius, spacing } from '../constants/theme';
import { useTheme } from '../lib/ThemeContext';
import { useI18n } from '../lib/i18n';
import Button from './ui/Button';

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '14:00', '16:00', '18:00'];

type Props = {
  visible: boolean;
  currentSlot?: string;
  providerName?: string;
  onClose: () => void;
  onConfirm: (slot: string, when: 'today' | 'tomorrow') => void | Promise<void>;
  loading?: boolean;
};

export default function RescheduleModal({
  visible,
  currentSlot,
  providerName,
  onClose,
  onConfirm,
  loading,
}: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => modalStyles(colors), [colors]);
  const [slot, setSlot] = useState(currentSlot || '10:00');
  const [when, setWhen] = useState<'today' | 'tomorrow'>('tomorrow');

  useEffect(() => {
    if (!visible) return;
    if (currentSlot && TIME_SLOTS.includes(currentSlot)) setSlot(currentSlot);
    else setSlot('10:00');
    setWhen('tomorrow');
  }, [visible, currentSlot]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t('reschedule_title')}</Text>
          {providerName ? (
            <Text style={styles.sub}>{t('reschedule_sub').replace('{name}', providerName)}</Text>
          ) : null}

          <Text style={styles.label}>{t('reschedule_day')}</Text>
          <View style={styles.row}>
            {(['today', 'tomorrow'] as const).map((d) => (
              <Pressable
                key={d}
                style={[styles.pill, when === d && styles.pillOn]}
                onPress={() => setWhen(d)}
              >
                <Text style={[styles.pillText, when === d && styles.pillTextOn]}>
                  {d === 'today' ? t('reschedule_today') : t('reschedule_tomorrow')}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('reschedule_time')}</Text>
          <View style={styles.slots}>
            {TIME_SLOTS.map((s) => (
              <Pressable
                key={s}
                style={[styles.slotBtn, slot === s && styles.slotOn]}
                onPress={() => setSlot(s)}
              >
                <Text style={[styles.slotText, slot === s && styles.slotTextOn]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Button
            label={loading ? t('pay_processing') : t('reschedule_confirm')}
            onPress={() => onConfirm(slot, when)}
            loading={loading}
            style={{ width: '100%', marginTop: spacing.md }}
          />
          <Pressable onPress={onClose} style={styles.cancel} disabled={loading}>
            <Text style={styles.cancelText}>{t('cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function modalStyles(colors: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 20,
      fontWeight: '600',
      color: colors.primaryText,
    },
    sub: {
      fontSize: 13,
      color: colors.text2,
      marginTop: 6,
      marginBottom: spacing.md,
      fontFamily: fonts.body,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: colors.text3,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
      fontFamily: fonts.body,
    },
    row: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
    pill: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    pillOn: { borderColor: colors.violet, backgroundColor: colors.violetSoft },
    pillText: { fontSize: 14, color: colors.text2, fontFamily: fonts.body },
    pillTextOn: { color: colors.violetBright, fontWeight: '700' },
    slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    slotBtn: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    slotOn: { borderColor: colors.violet, backgroundColor: colors.violetSoft },
    slotText: { fontSize: 14, color: colors.text, fontFamily: fonts.body },
    slotTextOn: { color: colors.violetBright, fontWeight: '700' },
    cancel: { alignItems: 'center', paddingVertical: spacing.md },
    cancelText: { color: colors.text2, fontSize: 14, fontFamily: fonts.body },
  });
}
