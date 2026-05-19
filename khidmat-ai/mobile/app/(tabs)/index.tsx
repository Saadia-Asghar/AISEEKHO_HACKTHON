import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { AppColors } from '../../constants/theme';
import { fonts, radius, spacing } from '../../constants/theme';
import { getSession } from '../../lib/auth';
import { getSuggestions, transcribeSpeech, getContactedWorkers } from '../../api/client';
import { runDiscoverSearch } from '../../lib/discoverSearch';
import SearchFilterDropdown from '../../components/SearchFilterDropdown';
import { useTheme } from '../../lib/ThemeContext';
import { useI18n } from '../../lib/i18n';
import type { ContactedWorker } from '../../api/client';
import { useBookingStore } from '../../lib/store';
import { getRecentSearches } from '../../lib/searchHistory';
import { getPriceSort, setPriceSort as persistPriceSort, type PriceSort } from '../../lib/bookingPrefs';
import ShimmerOverlay from '../../components/ShimmerOverlay';
import OnboardingModal from '../../components/OnboardingModal';
import { isRecording, startRecording, stopRecordingBase64 } from '../../lib/voice';
import { hasSeenOnboarding } from '../../lib/onboarding';
import { showToast } from '../../lib/toastStore';
import StitchAppHeader from '../../components/stitch/StitchAppHeader';
import StitchSearchBox, { StitchSearchActions } from '../../components/stitch/StitchSearchBox';
import StitchChipScroll from '../../components/stitch/StitchChipScroll';
import StitchSectionLabel from '../../components/stitch/StitchSectionLabel';
import StitchFeaturedCard from '../../components/stitch/StitchFeaturedCard';
import SearchSuggestionsPanel from '../../components/SearchSuggestionsPanel';
import GoogleBadge from '../../components/GoogleBadge';

const DEMO = 'Mujhe kal subah G-13 mein AC technician chahiye';

const CHIPS = [
  { label: 'AC', emoji: '⚡', phrase: 'AC technician', id: 'ac_technician' },
  { label: 'Plumber', emoji: '🔧', phrase: 'plumber', id: 'plumber' },
  { label: 'Electrician', emoji: '💡', phrase: 'electrician', id: 'electrician' },
  { label: 'Cleaner', emoji: '🧹', phrase: 'cleaner', id: 'cleaner' },
  { label: 'Painter', emoji: '🎨', phrase: 'painter', id: 'painter' },
  { label: 'Tutor', emoji: '📚', phrase: 'tutor', id: 'tutor' },
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => homeStyles(colors), [colors]);
  const { q, submit: autoSubmit } = useLocalSearchParams<{ q?: string; submit?: string }>();
  const [name, setName] = useState('Guest');
  const [input, setInput] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const pulse = useRef(new Animated.Value(1)).current;
  const { loading, setError, error, priceSort, setPriceSort, searchFilters, setSearchFilters } =
    useBookingStore();
  const submitting = useRef(false);
  const [recording, setRecording] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [contacted, setContacted] = useState<ContactedWorker[]>([]);
  const { t, lang } = useI18n();

  useEffect(() => {
    hasSeenOnboarding().then((seen) => {
      if (!seen) setShowGuide(true);
    });
    getSession().then(async (s) => {
      if (!s) return;
      setName(s.name);
      try {
        setContacted(await getContactedWorkers(s.userId));
      } catch {
        setContacted([]);
      }
    });
    getRecentSearches().then(setRecent);
    getPriceSort().then(setPriceSort);
    if (q) {
      const text = String(q);
      setInput(text);
      if (autoSubmit === '1' && text.trim()) setTimeout(() => runSearch(text), 500);
    }
    getSuggestions(new Date().getHours()).then((sug) =>
      setHighlight(new Set(sug.map((x) => x.service_type.replace(/_/g, ' '))))
    );
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const runSearch = useCallback(
    async (text: string) => {
      if (!text.trim() || submitting.current) return;
      submitting.current = true;
      try {
        await runDiscoverSearch(text, lang, t);
        setRecent(await getRecentSearches());
      } catch (e) {
        setError(e instanceof Error ? e.message : t('connect_error'));
      } finally {
        submitting.current = false;
      }
    },
    [lang, t, setError]
  );

  const onPriceSortChange = async (sort: PriceSort) => {
    setPriceSort(sort);
    await persistPriceSort(sort);
  };

  const bookContacted = (w: ContactedWorker) => {
    const cat = w.category.replace(/_/g, ' ');
    runSearch(`Mujhe ${cat} chahiye ${w.area} mein — prefer ${w.name}`);
  };

  const onMicPress = async () => {
    if (loading) return;
    if (Platform.OS === 'web') {
      setError('Voice works on phone — type or use Try Demo');
      return;
    }
    try {
      if (!recording) {
        await startRecording();
        setRecording(true);
        return;
      }
      setRecording(false);
      const { base64, mimeType } = await stopRecordingBase64();
      const { text } = await transcribeSpeech(base64, mimeType);
      setInput(text);
      await runSearch(text);
    } catch (e) {
      setRecording(false);
      setError(e instanceof Error ? e.message : 'Voice failed');
    }
  };

  const chipItems = CHIPS.map((c) => ({
    ...c,
    hot:
      highlight.has(c.phrase) ||
      [...highlight].some((h) => c.phrase.includes(h) || h.includes(c.phrase.split(' ')[0])),
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StitchAppHeader onSettings={() => router.push('/(tabs)/profile')} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.greet}>
            <Text style={styles.greetTitle}>
              Assalamu Alaikum 👋 {name}
            </Text>
            <Text style={styles.greetSub}>How can I assist you with your home today?</Text>
          </View>

          <View style={styles.micSection}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse }] }]} />
            <Pressable onPress={onMicPress} disabled={loading} style={styles.micBtn}>
              <Text style={styles.micIcon}>{recording ? '⏹' : '🎤'}</Text>
            </Pressable>
            <Text style={styles.micCaption}>
              {recording ? t('listening') : t('mic_hint')}
            </Text>
            <GoogleBadge compact />
          </View>

          <View style={styles.block}>
            <StitchSearchBox
              value={input}
              onChangeText={setInput}
              placeholder="Describe what you need help with..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              editable={!loading}
              footer={
                <StitchSearchActions
                  demoLabel={t('try_demo')}
                  bookLabel={t('book_now')}
                  loading={loading}
                  onDemo={() => {
                    setInput(DEMO);
                    runSearch(DEMO);
                  }}
                  onBook={() => {
                    if (!input.trim()) {
                      showToast(t('type_or_demo'));
                      return;
                    }
                    runSearch(input);
                  }}
                />
              }
            />
            {(searchFocused || input.length > 0) && (recent.length > 0 || contacted.length > 0) ? (
              <SearchSuggestionsPanel
                query={input}
                recent={recent}
                contacted={contacted}
                onSelectRecent={(text) => {
                  setInput(text);
                  setSearchFocused(false);
                }}
                onSelectContacted={bookContacted}
              />
            ) : null}
            <SearchFilterDropdown value={searchFilters} onChange={setSearchFilters} />
          </View>

          <StitchSectionLabel>Popular Services</StitchSectionLabel>
          <StitchChipScroll
            chips={chipItems}
            onSelect={(chip) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (chip.id) router.push({ pathname: '/browse', params: { category: chip.id } });
            }}
          />

          {recent.length > 0 ? (
            <>
              <StitchSectionLabel>Recent Searches</StitchSectionLabel>
              <View style={styles.recentWrap}>
                {recent.slice(0, 4).map((r) => (
                  <Pressable key={r} style={styles.recentPill} onPress={() => runSearch(r)}>
                    <Text style={styles.recentIcon}>🕐</Text>
                    <Text style={styles.recentText} numberOfLines={1}>
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <StitchFeaturedCard />

          <Pressable style={styles.browseLink} onPress={() => router.push('/browse')}>
            <Text style={styles.browseText}>{t('browse_all')}</Text>
          </Pressable>

          {error ? (
            <Pressable onPress={() => runSearch(input)} style={styles.errorBox}>
              <Text style={styles.errorTitle}>{t('connect_error')}</Text>
              <Text style={styles.error}>{error}</Text>
              <Text style={styles.errorRetry}>{t('tap_retry')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
        <ShimmerOverlay visible={loading} />
        <OnboardingModal visible={showGuide} onClose={() => setShowGuide(false)} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function homeStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 120 },
  greet: { paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
  greetTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  greetSub: { fontSize: 14, color: colors.text2, marginTop: 4, fontFamily: fonts.body },
  micSection: { alignItems: 'center', paddingVertical: spacing.lg },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  micBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  micIcon: { fontSize: 40 },
  micCaption: { fontSize: 14, color: colors.primaryText, marginTop: 12, fontFamily: fonts.body },
  block: { paddingHorizontal: spacing.lg },
  recentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  recentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '48%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(74, 68, 85, 0.35)',
  },
  recentIcon: { fontSize: 12 },
  recentText: { fontSize: 12, color: colors.text2, fontFamily: fonts.body, flex: 1 },
  browseLink: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  browseText: { fontSize: 14, fontWeight: '600', color: colors.primaryText, fontFamily: fonts.body },
  errorBox: {
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.roseSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorTitle: { color: colors.rose, fontWeight: '700', fontFamily: fonts.body },
  error: { color: colors.text2, fontSize: 13, marginTop: 4, fontFamily: fonts.body },
  errorRetry: { color: colors.primaryText, fontSize: 12, marginTop: 8, fontFamily: fonts.body },
  });
}
