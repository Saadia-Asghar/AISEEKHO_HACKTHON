import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../constants/theme';

export default function ReceiptScreen() {
  const result = useAppStore((s) => s.result);

  if (!result?.booking?.receipt) {
    return (
      <View style={styles.empty}>
        <Text style={styles.muted}>No receipt available.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>CONFIRMED</Text>
      </View>
      <Text style={styles.receipt}>{result.booking.receipt}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  muted: { color: colors.muted },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  badgeText: { color: colors.bg, fontWeight: '800', fontSize: 12 },
  receipt: {
    color: '#e2e8f0',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 20,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
