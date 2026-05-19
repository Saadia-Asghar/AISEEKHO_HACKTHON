import { useCallback, useEffect, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { AppColors } from '../constants/theme';
import { fonts, radius, spacing } from '../constants/theme';
import ThemedSafeArea from '../components/ThemedSafeArea';
import { useTheme } from '../lib/ThemeContext';
import StitchAppHeader from '../components/stitch/StitchAppHeader';
import StitchGlassCard from '../components/stitch/StitchGlassCard';
import Button from '../components/ui/Button';
import { useI18n } from '../lib/i18n';
import {
  requestNotificationPermission,
  useAppNotifications,
  type AppNotification,
} from '../lib/appNotifications';
import { showToast } from '../lib/toastStore';

function channelIcon(ch: AppNotification['channel']) {
  if (ch === 'whatsapp') return '💬';
  if (ch === 'sms') return '📱';
  if (ch === 'payment') return '💳';
  if (ch === 'booking') return '✅';
  if (ch === 'reminder') return '⏰';
  return '🔔';
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => listStyles(colors), [colors]);
  const { t } = useI18n();
  const { items, hydrated, hydrate, markRead, markAllRead } = useAppNotifications();

  const load = useCallback(async () => {
    await hydrate();
  }, [hydrate]);

  useEffect(() => {
    void load();
  }, [load]);

  const enablePush = async () => {
    const ok = await requestNotificationPermission();
    showToast(ok ? t('notifications_enabled') : t('notifications_denied'));
  };

  return (
    <ThemedSafeArea edges={['top', 'bottom']}>
      <StitchAppHeader title={t('notifications_title')} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={!hydrated} onRefresh={load} tintColor={colors.violet} />
        }
      >
        <View style={styles.toolbar}>
          <Button label={t('enable_push')} variant="outline" onPress={enablePush} style={{ flex: 1 }} />
          {items.some((n) => !n.read) ? (
            <Pressable style={styles.markAll} onPress={markAllRead}>
              <Text style={styles.markAllText}>{t('mark_all_read')}</Text>
            </Pressable>
          ) : null}
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>{t('notifications_empty')}</Text>
            <Text style={styles.emptySub}>{t('notifications_empty_sub')}</Text>
          </View>
        ) : (
          items.map((n) => (
            <Pressable key={n.id} onPress={() => markRead(n.id)}>
              <StitchGlassCard style={[styles.row, !n.read && styles.rowUnread]}>
                <Text style={styles.rowIcon}>{channelIcon(n.channel)}</Text>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{n.title}</Text>
                  <Text style={styles.rowBodyText}>{n.body}</Text>
                  <Text style={styles.rowTime}>{formatTime(n.createdAt)}</Text>
                </View>
                {!n.read ? <View style={styles.dot} /> : null}
              </StitchGlassCard>
            </Pressable>
          ))
        )}
      </ScrollView>
    </ThemedSafeArea>
  );
}

function listStyles(colors: AppColors) {
  return StyleSheet.create({
    scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
    toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    markAll: { paddingVertical: 12, paddingHorizontal: 8 },
    markAllText: { fontSize: 13, color: colors.violetBright, fontWeight: '600', fontFamily: fonts.body },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: spacing.md,
    },
    rowUnread: { borderColor: colors.violet, backgroundColor: colors.violetSoft },
    rowIcon: { fontSize: 22, marginTop: 2 },
    rowBody: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: fonts.body },
    rowBodyText: { fontSize: 13, color: colors.text2, marginTop: 4, lineHeight: 18, fontFamily: fonts.body },
    rowTime: { fontSize: 11, color: colors.text3, marginTop: 6, fontFamily: fonts.body },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.violet,
      marginTop: 6,
    },
    empty: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
    emptyIcon: { fontSize: 48, marginBottom: spacing.md },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: fonts.display },
    emptySub: {
      fontSize: 14,
      color: colors.text2,
      textAlign: 'center',
      marginTop: 8,
      paddingHorizontal: spacing.lg,
      fontFamily: fonts.body,
    },
  });
}
