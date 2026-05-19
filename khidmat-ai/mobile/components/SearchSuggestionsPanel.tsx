import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '../constants/theme';
import { fonts, radius, spacing } from '../constants/theme';
import type { ContactedWorker } from '../api/client';
import { useTheme } from '../lib/ThemeContext';
import { useI18n } from '../lib/i18n';

export default function SearchSuggestionsPanel({
  query,
  recent,
  contacted,
  onSelectRecent,
  onSelectContacted,
}: {
  query: string;
  recent: string[];
  contacted: ContactedWorker[];
  onSelectRecent: (text: string) => void;
  onSelectContacted: (worker: ContactedWorker) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => panelStyles(colors), [colors]);
  const { t } = useI18n();
  const q = query.trim().toLowerCase();
  const filteredRecent = q ? recent.filter((r) => r.toLowerCase().includes(q)) : recent;
  const filteredContacted = q
    ? contacted.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.area.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      )
    : contacted;

  if (!filteredRecent.length && !filteredContacted.length) return null;

  const callWorker = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    const tel = digits.startsWith('92') ? `+${digits}` : `+92${digits.replace(/^0/, '')}`;
    Linking.openURL(`tel:${tel}`).catch(() => {});
  };

  return (
    <View style={styles.panel}>
      {filteredContacted.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contacted')}</Text>
          {filteredContacted.map((w) => (
            <View key={w.id} style={styles.row}>
              <Pressable style={styles.rowMain} onPress={() => onSelectContacted(w)}>
                <Text style={styles.rowIcon}>👷</Text>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {w.name}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    ★ {w.rating.toFixed(1)} · {w.area}
                    {(w.bookings_count ?? 0) > 1 ? ` · ${w.bookings_count}×` : ''}
                  </Text>
                </View>
              </Pressable>
              <Pressable style={styles.callBtn} onPress={() => callWorker(w.phone)}>
                <Text style={styles.callText}>📞</Text>
              </Pressable>
              <Pressable style={styles.bookBtn} onPress={() => onSelectContacted(w)}>
                <Text style={styles.bookText}>{t('rebook')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {filteredRecent.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('recent')}</Text>
          {filteredRecent.map((r) => (
            <Pressable key={r} style={styles.row} onPress={() => onSelectRecent(r)}>
              <Text style={styles.rowIcon}>🕐</Text>
              <Text style={styles.recentText} numberOfLines={2}>
                {r}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function panelStyles(colors: AppColors) {
  return StyleSheet.create({
    panel: {
      marginTop: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border2,
      overflow: 'hidden',
    },
    section: { paddingVertical: spacing.sm },
    sectionTitle: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.text3,
      paddingHorizontal: spacing.md,
      marginBottom: 6,
      fontFamily: fonts.body,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    rowIcon: { fontSize: 18 },
    rowBody: { flex: 1 },
    rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: fonts.body },
    rowSub: { fontSize: 11, color: colors.text2, marginTop: 2, fontFamily: fonts.body },
    callBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.jadeSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    callText: { fontSize: 14 },
    bookBtn: {
      paddingHorizontal: 10,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.violet,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookText: { fontSize: 11, fontWeight: '700', color: colors.onPrimaryContainer, fontFamily: fonts.body },
    recentText: { flex: 1, fontSize: 13, color: colors.text2, fontFamily: fonts.body },
  });
}
