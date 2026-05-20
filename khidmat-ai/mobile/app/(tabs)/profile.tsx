import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { AppColors } from '../../constants/theme';
import { fonts, gradients, radius, spacing } from '../../constants/theme';
import { useTheme } from '../../lib/ThemeContext';
import { getSession, logout, type Session } from '../../lib/auth';
import { deleteUserAccount, getBookings, getUserReviews } from '../../api/client';
import { useI18n } from '../../lib/i18n';
import type { Lang } from '../../constants/i18n';
import { showToast } from '../../lib/toastStore';
import Avatar, { initials } from '../../components/Avatar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingModal from '../../components/OnboardingModal';
import StitchAppHeader from '../../components/stitch/StitchAppHeader';
import StitchGlassCard from '../../components/stitch/StitchGlassCard';

type Review = { rating: number; comment?: string; provider_name?: string };

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10 && digits.startsWith('92')) {
    const local = digits.slice(2);
    return `+92 ${local.slice(0, 3)} ${local.slice(3)}`.trim();
  }
  if (digits.length === 10) return `+92 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  return phone;
}

function ProfileLangPill() {
  const { colors } = useTheme();
  const styles = useMemo(() => profileStyles(colors), [colors]);
  const { lang, setLang, t } = useI18n();
  const pick = async (l: Lang) => {
    if (l === lang) return;
    await setLang(l);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  return (
    <View style={styles.langPill}>
      <Pressable onPress={() => pick('en')} hitSlop={6}>
        <Text style={[styles.langOpt, lang === 'en' && styles.langOptActive]}>{t('lang_english')}</Text>
      </Pressable>
      <Text style={styles.langSep}>/</Text>
      <Pressable onPress={() => pick('ur')} hitSlop={6}>
        <Text style={[styles.langOpt, lang === 'ur' && styles.langOptActive]}>{t('lang_urdu')}</Text>
      </Pressable>
    </View>
  );
}

function SettingRow({
  icon,
  iconBg,
  label,
  right,
  onPress,
  border,
}: {
  icon: string;
  iconBg: string;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  border?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => profileStyles(colors), [colors]);
  return (
    <Pressable
      style={[styles.settingRow, border && styles.settingBorder]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <Text style={styles.settingEmoji}>{icon}</Text>
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      {right ?? <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { colors, isDark, setScheme } = useTheme();
  const styles = useMemo(() => profileStyles(colors), [colors]);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const { t } = useI18n();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookingsCount, setBookingsCount] = useState<number | null>(null);
  const [showReviews, setShowReviews] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [avatarVariant, setAvatarVariant] = useState<'violet' | 'teal' | 'amber' | undefined>(undefined);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const load = useCallback(async () => {
    const s = await getSession();
    setSession(s);
    setSessionReady(true);
    if (!s) return;
    try {
      const [revs, bookings] = await Promise.all([
        getUserReviews(s.userId),
        getBookings(s.userId),
      ]);
      setReviews(revs);
      setBookingsCount(bookings.length);
    } catch {
      setReviews([]);
      setBookingsCount(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setSessionReady(false);
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (session) {
      AsyncStorage.getItem(`avatar_variant_${session.userId}`).then((val) => {
        if (val === 'violet' || val === 'teal' || val === 'amber') {
          setAvatarVariant(val);
        }
      });
    }
  }, [session]);

  const saveVariant = async (v: 'violet' | 'teal' | 'amber') => {
    setAvatarVariant(v);
    if (session) {
      await AsyncStorage.setItem(`avatar_variant_${session.userId}`, v);
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
      : '—';

  const bookingsDisplay = bookingsCount !== null ? String(bookingsCount) : '—';

  const performLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      setShowLogoutModal(false);
      setSession(null);
      await logout();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      showToast(t('could_not_logout'));
    } finally {
      setLoggingOut(false);
    }
  };

  if (!sessionReady) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StitchAppHeader />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primaryText} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StitchAppHeader />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <Avatar name={session.name} size={120} variant={avatarVariant} />
            </View>
            <Pressable style={styles.editBadge} onPress={() => setShowAvatarModal(true)}>
              <Text style={styles.editIcon}>✎</Text>
            </Pressable>
          </View>
          <Text style={styles.name}>{session.name}</Text>
          <Text style={styles.phone}>{formatPhone(session.phone)}</Text>
        </View>

        <View style={styles.statsRow}>
          <StitchGlassCard style={styles.statCard}>
            <Text style={[styles.statN, { color: colors.primaryText }]}>{bookingsDisplay}</Text>
            <Text style={styles.statL}>{t('stat_bookings')}</Text>
          </StitchGlassCard>
          <StitchGlassCard style={styles.statCard}>
            <Text style={[styles.statN, { color: colors.jade }]}>{avgRating}</Text>
            <Text style={styles.statL}>{t('stat_rating')}</Text>
          </StitchGlassCard>
        </View>

        <Text style={styles.sectionLabel}>{t('account_settings')}</Text>
        <StitchGlassCard style={styles.menuCard}>
          <SettingRow
            icon="🌐"
            iconBg="rgba(124, 58, 237, 0.2)"
            label={t('language')}
            right={<ProfileLangPill />}
            border
          />
          <SettingRow
            icon="🌙"
            iconBg="rgba(124, 58, 237, 0.2)"
            label={t('dark_mode')}
            right={
              <Switch
                value={isDark}
                onValueChange={async (on) => {
                  await setScheme(on ? 'dark' : 'light');
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: colors.switchTrackOff, true: colors.violet }}
                thumbColor="#fff"
              />
            }
            border
          />
          <SettingRow
            icon="🔔"
            iconBg="rgba(236, 106, 6, 0.2)"
            label={t('notifications_title')}
            onPress={() => router.push('/notifications')}
            border
          />
          <SettingRow
            icon="💳"
            iconBg="rgba(124, 58, 237, 0.2)"
            label={t('payment_methods')}
            onPress={() => router.push('/payment-methods')}
            border
          />
          <SettingRow
            icon="⭐"
            iconBg="rgba(0, 118, 80, 0.25)"
            label={t('my_reviews')}
            onPress={() => setShowReviews((v) => !v)}
            right={<Text style={styles.chevron}>{showReviews ? '▼' : '›'}</Text>}
            border
          />
          <SettingRow
            icon="❓"
            iconBg="rgba(236, 106, 6, 0.2)"
            label={t('help_support')}
            onPress={() => setShowGuide(true)}
            border
          />
          <SettingRow
            icon="📄"
            iconBg="rgba(124, 58, 237, 0.2)"
            label={t('terms_of_service')}
            onPress={() => router.push('/legal/terms')}
          />
        </StitchGlassCard>

        {showReviews ? (
          <View style={styles.reviews}>
            {reviews.length === 0 ? (
              <Text style={styles.miSmall}>No reviews yet — rate a provider after booking</Text>
            ) : (
              reviews.map((r, i) => (
                <StitchGlassCard key={i} style={styles.reviewCard}>
                  <Text style={styles.stars}>{'★'.repeat(r.rating)}</Text>
                  <Text style={styles.miSmall}>{r.provider_name}</Text>
                  {r.comment ? <Text style={styles.revText}>{r.comment}</Text> : null}
                </StitchGlassCard>
              ))
            )}
          </View>
        ) : null}

        <Pressable style={styles.actionCard} onPress={() => setShowLogoutModal(true)}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </Pressable>

        <Pressable style={styles.deleteCard} onPress={() => setShowDeleteModal(true)}>
          <Text style={styles.deleteIcon}>🗑️</Text>
          <Text style={styles.deleteText}>{t('delete_account')}</Text>
        </Pressable>

        <Text style={styles.footer}>{t('powered_by_google')}</Text>
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/')}
        accessibilityLabel={t('voice_search')}
      >
        <LinearGradient colors={[...gradients.violet]} style={styles.fabGrad}>
          <Text style={styles.fabIcon}>🎤</Text>
        </LinearGradient>
      </Pressable>

      <OnboardingModal visible={showGuide} onClose={() => setShowGuide(false)} />

      <Modal visible={showAvatarModal} transparent animationType="slide" onRequestClose={() => setShowAvatarModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAvatarModal(false)}>
          <Pressable style={[styles.modalCard, { paddingVertical: spacing.lg }]} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('choose_avatar_style')}</Text>
            <Text style={[styles.modalBody, { marginBottom: spacing.md }]}>{t('choose_avatar_sub')}</Text>
            
            <View style={{ flexDirection: 'row', gap: spacing.md, marginVertical: spacing.md, justifyContent: 'center', alignItems: 'center' }}>
              <Pressable 
                onPress={() => { saveVariant('violet'); setShowAvatarModal(false); }}
                style={[{ padding: spacing.xs, borderRadius: radius.lg, borderWidth: 2, borderColor: avatarVariant === 'violet' || (!avatarVariant && initials(session.name).charCodeAt(0) % 3 === 0) ? colors.violet : 'transparent' }]}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.onPrimaryContainer, fontWeight: '700', fontSize: 18, fontFamily: fonts.display }}>{initials(session.name)}</Text>
                </View>
              </Pressable>
              
              <Pressable 
                onPress={() => { saveVariant('teal'); setShowAvatarModal(false); }}
                style={[{ padding: spacing.xs, borderRadius: radius.lg, borderWidth: 2, borderColor: avatarVariant === 'teal' || (!avatarVariant && initials(session.name).charCodeAt(0) % 3 === 1) ? colors.jade : 'transparent' }]}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.jade, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.onPrimaryContainer, fontWeight: '700', fontSize: 18, fontFamily: fonts.display }}>{initials(session.name)}</Text>
                </View>
              </Pressable>
              
              <Pressable 
                onPress={() => { saveVariant('amber'); setShowAvatarModal(false); }}
                style={[{ padding: spacing.xs, borderRadius: radius.lg, borderWidth: 2, borderColor: avatarVariant === 'amber' || (!avatarVariant && initials(session.name).charCodeAt(0) % 3 === 2) ? colors.amber : 'transparent' }]}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.onPrimaryContainer, fontWeight: '700', fontSize: 18, fontFamily: fonts.display }}>{initials(session.name)}</Text>
                </View>
              </Pressable>
            </View>

            <Pressable style={[styles.modalCancelBtn, { marginTop: spacing.md }]} onPress={() => setShowAvatarModal(false)}>
              <Text style={styles.modalCancelLabel}>{t('cancel')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowLogoutModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Log out?</Text>
            <Text style={styles.modalBody}>You will need to sign in again to book services.</Text>
            <Pressable
              style={styles.modalDeleteBtn}
              onPress={performLogout}
              disabled={loggingOut}
            >
              <Text style={styles.modalDeleteLabel}>{loggingOut ? '…' : 'Log out'}</Text>
            </Pressable>
            <Pressable style={styles.modalCancelBtn} onPress={() => setShowLogoutModal(false)}>
              <Text style={styles.modalCancelLabel}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDeleteModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalIconWrap}>
              <Text style={styles.modalWarn}>⚠️</Text>
            </View>
            <Text style={styles.modalTitle}>{t('delete_account_title')}</Text>
            <Text style={styles.modalBody}>{t('delete_account_body')}</Text>
            <Pressable
              style={styles.modalDeleteBtn}
              onPress={async () => {
                if (!session) return;
                setShowDeleteModal(false);
                try {
                  await deleteUserAccount(session.userId);
                  setSession(null);
                  showToast(t('account_deleted'));
                  await logout();
                } catch {
                  showToast(t('could_not_delete'));
                }
              }}
            >
              <Text style={styles.modalDeleteLabel}>{t('delete_confirm')}</Text>
            </Pressable>
            <Pressable style={styles.modalCancelBtn} onPress={() => setShowDeleteModal(false)}>
              <Text style={styles.modalCancelLabel}>{t('cancel')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function profileStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  hero: { alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.lg },
  avatarWrap: { position: 'relative', marginBottom: spacing.md },
  avatarRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  editBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryText,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  editIcon: { fontSize: 16, color: colors.violetDeep, fontWeight: '700' },
  name: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.3,
  },
  phone: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text2,
    marginTop: 4,
    opacity: 0.85,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  statN: { fontFamily: fonts.display, fontSize: 24, fontWeight: '600' },
  statL: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.text2,
    marginTop: 4,
    fontFamily: fonts.body,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.text2,
    paddingHorizontal: 4,
    marginBottom: spacing.sm,
    fontFamily: fonts.body,
  },
  menuCard: { marginBottom: spacing.md },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 68, 85, 0.35)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingEmoji: { fontSize: 20 },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    fontFamily: fonts.body,
  },
  chevron: { color: colors.text3, fontSize: 20, fontWeight: '300' },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(74, 68, 85, 0.35)',
  },
  langOpt: { fontSize: 12, fontWeight: '600', color: colors.text2, fontFamily: fonts.body },
  langOptActive: { color: colors.primaryText },
  langSep: { fontSize: 12, color: colors.text2, opacity: 0.6 },
  reviews: { gap: spacing.sm, marginBottom: spacing.md },
  reviewCard: { padding: spacing.md },
  stars: { color: colors.amber, marginBottom: 4 },
  miSmall: { fontSize: 12, color: colors.text3, fontFamily: fonts.body },
  revText: { color: colors.text2, fontSize: 13, marginTop: 4, fontFamily: fonts.body },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.25)',
  },
  logoutIcon: { fontSize: 20 },
  logoutText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    fontFamily: fonts.display,
  },
  deleteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  deleteIcon: { fontSize: 20 },
  deleteText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    fontFamily: fonts.display,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.text3,
    opacity: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    fontFamily: fonts.body,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 96,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGrad: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 26 },
  link: { color: colors.primaryText, fontFamily: fonts.body },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 19, 21, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.glass,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(147, 0, 10, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalWarn: { fontSize: 32 },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalBody: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text2,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalDeleteBtn: {
    width: '100%',
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalDeleteLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#690005',
    fontFamily: fonts.display,
  },
  modalCancelBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border2,
    alignItems: 'center',
  },
  modalCancelLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    fontFamily: fonts.display,
  },
  });
}
