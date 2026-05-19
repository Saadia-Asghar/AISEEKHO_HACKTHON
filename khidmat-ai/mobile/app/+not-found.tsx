import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadows, spacing } from '../constants/theme';
import StitchAppHeader from '../components/stitch/StitchAppHeader';
import Button from '../components/ui/Button';
import { showToast } from '../lib/toastStore';

/** Stitch `404_error_page` — route miss / unknown deep link */
export default function NotFoundScreen() {
  const goHome = () => router.replace('/');
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else goHome();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StitchAppHeader
        onBack={goBack}
        right={
          <Pressable hitSlop={8} accessibilityLabel="More">
            <Text style={styles.more}>⋮</Text>
          </Pressable>
        }
      />

      <View style={styles.main}>
        <View style={styles.illusWrap}>
          <View style={styles.ambient} />
          <View style={[styles.glassCard, shadows.card]}>
            <Text style={styles.robot}>🤖</Text>
            <View style={styles.toolRow}>
              <Text style={styles.tool}>🔧</Text>
              <Text style={styles.tool}>⚡</Text>
              <Text style={styles.tool}>🚿</Text>
            </View>
          </View>
          <View style={[styles.badge, styles.badgeTop]}>
            <Text style={styles.badgeIcon}>⚡</Text>
          </View>
          <View style={[styles.badge, styles.badgeBottom]}>
            <Text style={styles.badgeIcon}>🔗</Text>
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.headline}>Something went wrong</Text>
          <Text style={styles.body}>
            Our AI agents couldn&apos;t find this page, but they&apos;re great at fixing sinks!
          </Text>
        </View>

        <View style={styles.actions}>
          <Button label="←  Back to Home" onPress={goHome} variant="violet" style={styles.homeBtn} />
          <Pressable
            onPress={() => {
              showToast('Thanks — we will look into it.');
              Linking.openURL('mailto:support@khidmat.ai?subject=404%20Report').catch(() => {});
            }}
            style={styles.report}
          >
            <Text style={styles.reportIcon}>💬</Text>
            <Text style={styles.reportText}>Report Issue</Text>
          </Pressable>
        </View>

        <Text style={styles.debug}>Error Code: 404_KHIDMAT_VOID</Text>
      </View>

      <Text style={styles.footer}>Powered by Google</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090B' },
  more: { color: colors.text2, fontSize: 22, paddingHorizontal: 4 },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  illusWrap: {
    width: 256,
    height: 256,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  ambient: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  glassCard: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 32,
    padding: spacing.xl,
    alignItems: 'center',
    zIndex: 1,
  },
  robot: { fontSize: 72, marginBottom: spacing.md },
  toolRow: { flexDirection: 'row', gap: spacing.sm },
  tool: { fontSize: 28 },
  badge: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: radius.pill,
    padding: 10,
    zIndex: 2,
  },
  badgeTop: { top: 8, right: 16, transform: [{ rotate: '12deg' }] },
  badgeBottom: { bottom: 16, left: 8, transform: [{ rotate: '-12deg' }] },
  badgeIcon: { fontSize: 20 },
  textBlock: { maxWidth: 320, alignItems: 'center', gap: spacing.md },
  headline: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text2,
    textAlign: 'center',
    opacity: 0.85,
  },
  actions: { marginTop: spacing.xl, width: '100%', maxWidth: 280, alignItems: 'center' },
  homeBtn: { width: '100%' },
  report: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  reportIcon: { fontSize: 16 },
  reportText: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text2,
  },
  debug: {
    marginTop: spacing.xl,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.text3,
    opacity: 0.35,
  },
  footer: {
    textAlign: 'center',
    paddingBottom: spacing.lg,
    fontSize: 12,
    color: colors.text3,
    opacity: 0.7,
    fontFamily: fonts.body,
  },
});
