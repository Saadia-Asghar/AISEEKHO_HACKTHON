import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../../constants/theme';
import StitchAppHeader from './StitchAppHeader';

/** Standard Stitch page shell — fixed KhidmatAI bar + optional section title */
export default function StitchScreen({
  children,
  title,
  subtitle,
  onBack,
  onSettings,
  right,
  scroll = true,
  contentStyle,
  edges = ['top'] as const,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onSettings?: () => void;
  right?: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scroll, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <StitchAppHeader onBack={onBack} onSettings={onSettings} right={right} />
      {title ? (
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  sectionHead: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: '600',
    color: colors.primaryText,
  },
  sectionSub: {
    fontSize: 14,
    color: colors.text2,
    marginTop: 6,
    lineHeight: 20,
    fontFamily: fonts.body,
  },
  scroll: { paddingBottom: 100 },
  body: { flex: 1 },
});
