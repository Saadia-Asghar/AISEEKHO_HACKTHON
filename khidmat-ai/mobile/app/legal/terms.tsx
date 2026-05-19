import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { AppColors } from '../../constants/theme';
import { fonts, radius, spacing } from '../../constants/theme';
import { useTheme } from '../../lib/ThemeContext';
import ThemedSafeArea from '../../components/ThemedSafeArea';
import StitchAppHeader from '../../components/stitch/StitchAppHeader';
import StitchGlassCard from '../../components/stitch/StitchGlassCard';

const SECTIONS = [
  {
    title: '1. About KhidmatAI',
    body:
      'KhidmatAI (“we”, “the app”) is an AI service orchestrator for Pakistan’s informal economy. ' +
      'It helps you find and book local services (plumbers, AC technicians, tutors, and more) using ' +
      'natural language in Urdu, Roman Urdu, or English. This demo is built for the Google Antigravity Hackathon 2026.',
  },
  {
    title: '2. Demo & mock data',
    body:
      'Bookings, payments, SMS, WhatsApp, and push reminders may be simulated for demonstration. ' +
      'Provider listings use a mock dataset unless live Google Maps is enabled. Do not enter real ' +
      'sensitive personal data you would not share in a hackathon demo.',
  },
  {
    title: '3. AI & automation',
    body:
      'Search results are produced by a multi-agent pipeline (intent, discovery, ranking, booking, ' +
      'follow-up, trace). Recommendations are automated, not human dispatchers. Always verify ' +
      'provider details before paying or meeting someone.',
  },
  {
    title: '4. Payments',
    body:
      'Card, JazzCash, Easypaisa, and cash options may be simulated. Live payment processing ' +
      'requires separate production configuration (e.g. Stripe). Charges shown are estimates in PKR.',
  },
  {
    title: '5. Location & maps',
    body:
      'Location is used to rank nearby providers. Maps may use Google Static Maps or OpenStreetMap. ' +
      'Opening external Maps or WhatsApp links leaves the app and is subject to those services’ terms.',
  },
  {
    title: '6. Your responsibilities',
    body:
      'You agree to use KhidmatAI lawfully, treat providers respectfully, and not abuse OTP, API, or ' +
      'automation features. You are responsible for activity under your account.',
  },
  {
    title: '7. Limitation of liability',
    body:
      'The app is provided “as is” for demonstration. We are not liable for missed appointments, ' +
      'provider conduct, or losses from reliance on AI-generated suggestions.',
  },
  {
    title: '8. Contact',
    body:
      'Hackathon build — questions via your team repository or demo presentation. ' +
      'Production support channels would be listed here before a public launch.',
  },
];

export default function TermsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => termStyles(colors), [colors]);

  return (
    <ThemedSafeArea edges={['top', 'bottom']}>
      <StitchAppHeader onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.updated}>Last updated: May 2026 · KhidmatAI demo</Text>

        <StitchGlassCard style={styles.intro}>
          <Text style={styles.introText}>
            By using KhidmatAI you agree to these terms. Tap any section below for details.
          </Text>
        </StitchGlassCard>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Speak your need. KhidmatAI handles the rest.
        </Text>
      </ScrollView>
    </ThemedSafeArea>
  );
}

function termStyles(colors: AppColors) {
  return StyleSheet.create({
    scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
    title: {
      fontFamily: fonts.display,
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    updated: { fontSize: 12, color: colors.text3, marginBottom: spacing.lg, fontFamily: fonts.body },
    intro: { padding: spacing.md, marginBottom: spacing.lg },
    introText: { fontSize: 14, color: colors.text2, lineHeight: 22, fontFamily: fonts.body },
    section: {
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      fontFamily: fonts.body,
    },
    sectionBody: { fontSize: 14, color: colors.text2, lineHeight: 22, fontFamily: fonts.body },
    footer: {
      textAlign: 'center',
      fontSize: 13,
      color: colors.text3,
      marginTop: spacing.lg,
      fontFamily: fonts.body,
    },
  });
}
