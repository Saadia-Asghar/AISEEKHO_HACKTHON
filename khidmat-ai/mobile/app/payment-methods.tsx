import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, fonts, radius, spacing } from '../constants/theme';
import StitchAppHeader from '../components/stitch/StitchAppHeader';
import StitchGlassCard from '../components/stitch/StitchGlassCard';
import {
  getSavedCards,
  getSavedWallets,
  getSelectedPaymentId,
  setSelectedPaymentId,
  type SavedCard,
  type SavedWallet,
} from '../lib/paymentMethods';
import { showToast } from '../lib/toastStore';

function CardBrandIcon({ brand }: { brand: SavedCard['brand'] }) {
  return (
    <View style={styles.brandBox}>
      <Text style={styles.brandEmoji}>{brand === 'visa' ? '💳' : '🔴'}</Text>
    </View>
  );
}

export default function PaymentMethodsScreen() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [wallets, setWallets] = useState<SavedWallet[]>([]);
  const [selected, setSelected] = useState('visa-1');

  const load = useCallback(async () => {
    const [c, w, sel] = await Promise.all([getSavedCards(), getSavedWallets(), getSelectedPaymentId()]);
    setCards(c);
    setWallets(w);
    setSelected(sel);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const select = async (id: string) => {
    setSelected(id);
    await setSelectedPaymentId(id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StitchAppHeader title="Payment Methods" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Saved Methods</Text>
        <View style={styles.list}>
          {cards.map((card) => {
            const active = selected === card.id;
            return (
              <Pressable key={card.id} onPress={() => select(card.id)}>
                <StitchGlassCard style={styles.row}>
                  <View style={styles.rowLeft}>
                    <CardBrandIcon brand={card.brand} />
                    <View>
                      <Text style={styles.rowTitle}>
                        {card.brand === 'visa' ? 'Visa' : 'Mastercard'} ending in {card.last4}
                      </Text>
                      <Text style={styles.rowSub}>Expires {card.expiry}</Text>
                    </View>
                  </View>
                  <Text style={[styles.check, active && styles.checkActive]}>
                    {active ? '●' : '○'}
                  </Text>
                </StitchGlassCard>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Digital Wallets</Text>
        <View style={styles.list}>
          {wallets.map((w) => (
            <Pressable
              key={w.id}
              onPress={() => showToast(`${w.type === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} settings coming soon`)}
            >
              <StitchGlassCard style={styles.row}>
                <View style={styles.rowLeft}>
                  <View
                    style={[
                      styles.walletIcon,
                      {
                        backgroundColor:
                          w.type === 'jazzcash' ? 'rgba(236, 106, 6, 0.2)' : 'rgba(0, 118, 80, 0.25)',
                      },
                    ]}
                  >
                    <Text style={styles.walletEmoji}>{w.type === 'jazzcash' ? '👛' : '💚'}</Text>
                  </View>
                  <View>
                    <Text style={styles.rowTitle}>
                      {w.type === 'jazzcash' ? 'JazzCash Wallet' : 'EasyPaisa'}
                    </Text>
                    <Text style={styles.rowSub}>{w.phoneMasked}</Text>
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </StitchGlassCard>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.addBtn} onPress={() => router.push('/add-card')}>
          <Text style={styles.addIcon}>＋</Text>
          <Text style={styles.addLabel}>Add New Payment Method</Text>
        </Pressable>

        <View style={styles.secure}>
          <Text style={styles.lock}>🔒</Text>
          <Text style={styles.secureText}>
            All transactions are encrypted and secure.{'\n'}
            Your payment details are never stored directly on our servers.
          </Text>
        </View>

        <Text style={styles.footer}>Powered by Google</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.text2,
    marginBottom: spacing.md,
    fontFamily: fonts.body,
  },
  list: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  brandBox: {
    width: 48,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmoji: { fontSize: 18 },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletEmoji: { fontSize: 20 },
  rowTitle: { fontSize: 14, fontWeight: '500', color: colors.text, fontFamily: fonts.body },
  rowSub: { fontSize: 12, color: colors.text2, marginTop: 2, fontFamily: fonts.body },
  check: { fontSize: 22, color: colors.text3 },
  checkActive: { color: colors.primaryText },
  chevron: { fontSize: 20, color: colors.text3 },
  addBtn: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.violet,
    paddingVertical: 16,
    borderRadius: radius.lg,
    shadowColor: colors.violet,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  addIcon: { fontSize: 18, color: colors.onPrimaryContainer, fontWeight: '700' },
  addLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onPrimaryContainer,
    fontFamily: fonts.body,
  },
  secure: { alignItems: 'center', marginTop: spacing.xl, opacity: 0.65, paddingHorizontal: spacing.md },
  lock: { fontSize: 20, marginBottom: 6 },
  secureText: {
    fontSize: 12,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: fonts.body,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.text3,
    opacity: 0.7,
    marginTop: spacing.lg,
    fontFamily: fonts.body,
  },
});
