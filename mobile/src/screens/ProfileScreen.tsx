import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { clearAuth } from '../storage/authStorage';
import { useUserStore } from '../store/useUserStore';
import { useTheme } from '../hooks/useTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { ThemeColors } from '../constants/theme';
import { BRAND, TAGLINE, FONT_BOLD, FONT_REGULAR, RADIUS_XL } from '../constants/theme';
import HazirLogo from '../components/HazirLogo';
import HapticPressable from '../components/HapticPressable';
import { upcomingCount, updateUserLanguage } from '../api/api';

export default function ProfileScreen() {
  const { mode, setMode } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { userId, displayName, phone, language, setLanguage, clearUser } = useUserStore();
  const [stats, setStats] = useState({ bookings: 0 });

  useFocusEffect(
    useCallback(() => {
      if (userId) upcomingCount(userId).then((r) => setStats({ bookings: r.count }));
    }, [userId])
  );

  const onLanguage = async (lang: 'en' | 'ur') => {
    setLanguage(lang);
    if (userId) {
      try {
        await updateUserLanguage(userId, lang);
      } catch {
        /* offline ok */
      }
    }
  };

  const onLogout = async () => {
    await clearAuth();
    clearUser();
  };

  return (
    <View style={styles.root}>
      <HazirLogo size={56} />
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.phone}>{phone}</Text>
      <Text style={styles.brand}>{BRAND}</Text>
      <Text style={styles.tagline}>{TAGLINE}</Text>

      <Text style={styles.label}>Language / زبان</Text>
      <View style={styles.row}>
        {(['en', 'ur'] as const).map((lang) => (
          <HapticPressable
            key={lang}
            style={[styles.pill, language === lang && styles.pillActive]}
            onPress={() => onLanguage(lang)}
          >
            <Text style={[styles.pillText, language === lang && styles.pillTextActive]}>
              {lang === 'en' ? 'English' : 'اردو'}
            </Text>
          </HapticPressable>
        ))}
      </View>

      <Text style={styles.label}>Appearance</Text>
      <View style={styles.row}>
        {(['dark', 'light'] as const).map((m) => (
          <HapticPressable
            key={m}
            style={[styles.pill, mode === m && styles.pillActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.pillText, mode === m && styles.pillTextActive]}>
              {m === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </Text>
          </HapticPressable>
        ))}
      </View>

      <Text style={styles.stats}>Upcoming bookings: {stats.bookings}</Text>

      <HapticPressable style={styles.logout} onPress={onLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </HapticPressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, padding: 24, alignItems: 'center', backgroundColor: colors.bg },
    name: { fontSize: 24, fontWeight: '800', marginTop: 12, color: colors.text, fontFamily: FONT_BOLD },
    phone: { color: colors.muted, marginTop: 4, fontFamily: FONT_REGULAR },
    brand: { fontSize: 16, fontWeight: '700', marginTop: 16, color: colors.primary, fontFamily: FONT_BOLD },
    tagline: { color: colors.dim, fontStyle: 'italic', marginTop: 4, fontFamily: FONT_REGULAR },
    label: {
      alignSelf: 'stretch',
      color: colors.dim,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      marginTop: 24,
      marginBottom: 10,
    },
    row: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
    pill: {
      flex: 1,
      padding: 14,
      borderRadius: RADIUS_XL,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    pillActive: { borderColor: colors.primary, backgroundColor: colors.surface, shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 8 },
    pillText: { color: colors.muted, fontWeight: '600' },
    pillTextActive: { color: colors.primary },
    stats: { color: colors.muted, marginTop: 20, fontFamily: FONT_REGULAR },
    logout: {
      marginTop: 32,
      padding: 14,
      borderRadius: RADIUS_XL,
      borderWidth: 1,
      borderColor: colors.error,
      alignSelf: 'stretch',
      alignItems: 'center',
    },
    logoutText: { color: colors.error, fontWeight: '600' },
  });
