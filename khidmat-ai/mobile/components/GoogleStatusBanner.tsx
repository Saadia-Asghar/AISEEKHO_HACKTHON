import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { getGoogleStatus } from '../api/client';
import { useI18n } from '../lib/i18n';

export default function GoogleStatusBanner() {
  const { t } = useI18n();
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    getGoogleStatus()
      .then((s) => {
        const m: string[] = [];
        if (!s.gemini_configured) m.push('Gemini');
        if (!s.maps_configured) m.push('Maps');
        setMissing(m);
      })
      .catch(() => setMissing([]));
  }, []);

  if (missing.length === 0) return null;

  return (
    <Pressable style={styles.banner}>
      <Text style={styles.title}>{t('google_banner_title')}</Text>
      <Text style={styles.body}>
        {t('google_banner_body').replace('{keys}', missing.join(', '))}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.amberSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(232,168,56,0.35)',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.amber,
    fontFamily: fonts.body,
    marginBottom: 4,
  },
  body: { fontSize: 11, color: colors.text2, lineHeight: 16, fontFamily: fonts.body },
});
