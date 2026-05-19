import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '../constants/theme';
import { fonts, radius, spacing } from '../constants/theme';
import type { ContactedWorker } from '../api/client';
import { useTheme } from '../lib/ThemeContext';
import { useI18n } from '../lib/i18n';
import Avatar from './Avatar';

type Props = {
  workers: ContactedWorker[];
  onBook: (w: ContactedWorker) => void;
  onProfile?: (id: string) => void;
};

export default function ContactedWorkersSection({ workers, onBook, onProfile }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => sectionStyles(colors), [colors]);
  const { t } = useI18n();

  if (!workers.length) return null;

  const callWorker = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    const tel = digits.startsWith('92') ? `+${digits}` : `+92${digits.replace(/^0/, '')}`;
    Linking.openURL(`tel:${tel}`).catch(() => {});
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('contacted')}</Text>
      <Text style={styles.sub}>Tap to book again · Call to reach directly</Text>
      {workers.slice(0, 6).map((w) => (
        <View key={w.id} style={styles.card}>
          <Pressable style={styles.main} onPress={() => onProfile?.(w.id)}>
            <Avatar name={w.name} size={44} square />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {w.name}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {w.category.replace(/_/g, ' ')} · {w.area} · ★ {w.rating.toFixed(1)}
              </Text>
            </View>
          </Pressable>
          <View style={styles.actions}>
            <Pressable style={styles.callBtn} onPress={() => callWorker(w.phone)}>
              <Text style={styles.callText}>📞</Text>
            </Pressable>
            <Pressable style={styles.bookBtn} onPress={() => onBook(w)}>
              <Text style={styles.bookText}>{t('rebook')}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function sectionStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: { paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
    title: {
      fontFamily: fonts.display,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    sub: { fontSize: 12, color: colors.text2, marginTop: 4, marginBottom: spacing.sm, fontFamily: fonts.body },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      marginBottom: 8,
      gap: 8,
    },
    main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    info: { flex: 1 },
    name: { fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: fonts.body },
    meta: { fontSize: 11, color: colors.text2, marginTop: 2, fontFamily: fonts.body },
    actions: { flexDirection: 'row', gap: 6 },
    callBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.jadeSoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.jade,
    },
    callText: { fontSize: 16 },
    bookBtn: {
      paddingHorizontal: 12,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.violet,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookText: { color: colors.onPrimaryContainer, fontSize: 12, fontWeight: '700', fontFamily: fonts.body },
  });
}
