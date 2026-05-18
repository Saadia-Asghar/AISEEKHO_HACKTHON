import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { dismissTip, isTipDismissed } from '../lib/onboarding';

type Props = {
  tipId: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function TipCard({ tipId, title, message, actionLabel, onAction }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    isTipDismissed(tipId).then((d) => setVisible(!d));
  }, [tipId]);

  if (!visible) return null;

  const close = async () => {
    await dismissTip(tipId);
    setVisible(false);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>💡 {title}</Text>
        <Pressable onPress={close} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.violetSoft,
    borderWidth: 1,
    borderColor: 'rgba(123,94,167,0.3)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 13, fontWeight: '700', color: colors.violetBright, fontFamily: fonts.body, flex: 1 },
  close: { color: colors.text3, fontSize: 16, paddingLeft: 8 },
  message: {
    fontSize: 12,
    color: colors.text2,
    lineHeight: 18,
    marginTop: 6,
    fontFamily: fonts.body,
  },
  action: { marginTop: spacing.sm },
  actionText: { color: colors.violetBright, fontWeight: '600', fontSize: 12, fontFamily: fonts.body },
});
