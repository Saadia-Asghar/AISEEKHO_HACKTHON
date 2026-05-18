import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import type { ContactedWorker } from '../api/client';

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
  const q = query.trim().toLowerCase();
  const filteredRecent = q
    ? recent.filter((r) => r.toLowerCase().includes(q))
    : recent;
  const filteredContacted = q
    ? contacted.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.area.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      )
    : contacted;

  if (!filteredRecent.length && !filteredContacted.length) return null;

  return (
    <View style={styles.panel}>
      {filteredContacted.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Previously contacted</Text>
          {filteredContacted.map((w) => (
            <Pressable key={w.id} style={styles.row} onPress={() => onSelectContacted(w)}>
              <Text style={styles.rowIcon}>👷</Text>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {w.name}
                </Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  ★ {w.rating.toFixed(1)} · {w.area}
                  {(w.bookings_count ?? 0) > 1 ? ` · ${w.bookings_count}× booked` : ''}
                </Text>
              </View>
              <Text style={styles.rowAction}>Book</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {filteredRecent.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent searches</Text>
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

const styles = StyleSheet.create({
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
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowIcon: { fontSize: 18 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: fonts.body },
  rowSub: { fontSize: 11, color: colors.text2, marginTop: 2, fontFamily: fonts.body },
  rowAction: { fontSize: 12, fontWeight: '700', color: colors.violetBright, fontFamily: fonts.body },
  recentText: { flex: 1, fontSize: 13, color: colors.text2, fontFamily: fonts.body },
});
