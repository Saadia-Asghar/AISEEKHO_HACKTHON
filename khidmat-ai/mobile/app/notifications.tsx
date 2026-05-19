import { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
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
  const items = useAppNotifications((s) => s.items);
  const hydrated = useAppNotifications((s) => s.hydrated);
  const hydrate = useAppNotifications((s) => s.hydrate);
  const markRead = useAppNotifications((s) => s.markRead);
  const markAllRead = useAppNotifications((s) => s.markAllRead);
  const remove = useAppNotifications((s) => s.remove);
  const clearAll = useAppNotifications((s) => s.clearAll);

  const load = useCallback(async () => {
    await hydrate();
  }, [hydrate]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const enablePush = async () => {
    const ok = await requestNotificationPermission();
    showToast(ok ? t('notifications_enabled') : t('notifications_denied'));
  };

  const dismissOne = (id: string) => {
    remove(id);
  };

  const dismissAll = () => {
    clearAll();
    showToast(t('notifications_cleared'));
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
        </View>
        <View style={styles.toolbar}>
          {items.some((n) => !n.read) ? (
            <Pressable style={styles.textBtn} onPress={markAllRead}>
              <Text style={styles.textBtnLabel}>{t('mark_all_read')}</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {items.length > 0 ? (
            <Pressable style={styles.textBtn} onPress={dismissAll}>
              <Text style={[styles.textBtnLabel, styles.clearLabel]}>{t('clear_all_notifications')}</Text>
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
            <StitchGlassCard key={n.id} style={[styles.row, !n.read && styles.rowUnread]}>
              <Pressable style={styles.rowMain} onPress={() => markRead(n.id)}>
                <Text style={styles.rowIcon}>{channelIcon(n.channel)}</Text>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{n.title}</Text>
                  <Text style={styles.rowBodyText}>{n.body}</Text>
                  <Text style={styles.rowTime}>{formatTime(n.createdAt)}</Text>
                </View>
                {!n.read ? <View style={styles.dot} /> : null}
              </Pressable>
              <Pressable
                style={styles.closeBtn}
                onPress={() => dismissOne(n.id)}
                hitSlop={12}
                accessibilityLabel={t('dismiss_notification')}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            </StitchGlassCard>
          ))
        )}
      </ScrollView>
    </ThemedSafeArea>
  );
}

function listStyles(colors: AppColors) {
  return StyleSheet.create({
    scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
    toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    textBtn: { paddingVertical: 8, paddingHorizontal: 4 },
    textBtnLabel: { fontSize: 13, color: colors.violetBright, fontWeight: '600', fontFamily: fonts.body },
    clearLabel: { color: colors.rose },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingVertical: 4,
      paddingLeft: spacing.md,
      paddingRight: 4,
    },
    rowUnread: { borderColor: colors.violet, backgroundColor: colors.violetSoft },
    rowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: spacing.sm,
    },
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
      marginTop: 8,
      marginRight: 4,
    },
    closeBtn: {
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeIcon: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text2,
      lineHeight: 22,
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
