import { useCallback, useEffect, useRef, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, gradients, radius, shadows, spacing } from '../../constants/theme';
import { getSession } from '../../lib/auth';
import { discover, getSuggestions, transcribeSpeech, getContactedWorkers } from '../../api/client';
import SearchFilters, { type SearchFilterState } from '../../components/SearchFilters';
import { useI18n } from '../../lib/i18n';
import type { ContactedWorker } from '../../api/client';
import { useBookingStore } from '../../lib/store';
import { addRecentSearch, getRecentSearches } from '../../lib/searchHistory';
import { getPriceSort, setPriceSort as persistPriceSort, type PriceSort } from '../../lib/bookingPrefs';
import { getUserCoords } from '../../lib/location';
import ShimmerOverlay from '../../components/ShimmerOverlay';
import SecLabel from '../../components/ui/SecLabel';
import Button from '../../components/ui/Button';
import OnboardingModal from '../../components/OnboardingModal';
import TipCard from '../../components/TipCard';
import { isRecording, startRecording, stopRecordingBase64 } from '../../lib/voice';
import { hasSeenOnboarding } from '../../lib/onboarding';
import { showToast } from '../../lib/toastStore';
import ExamplePhrases from '../../components/ExamplePhrases';
import BookingFlowBar from '../../components/BookingFlowBar';
import DashboardHeader from '../../components/DashboardHeader';
import CurvedSheet from '../../components/ui/CurvedSheet';
import ServiceGrid from '../../components/ServiceGrid';
import InputField from '../../components/ui/InputField';
import PriceSortChips from '../../components/PriceSortChips';
import SearchSuggestionsPanel from '../../components/SearchSuggestionsPanel';

const DEMO = 'Mujhe kal subah G-13 mein AC technician chahiye';

const CHIPS = [
  { label: 'AC Repair', emoji: '❄️', phrase: 'AC technician' },
  { label: 'Plumber', emoji: '🔧', phrase: 'plumber' },
  { label: 'Electrician', emoji: '⚡', phrase: 'electrician' },
  { label: 'Cleaner', emoji: '🧹', phrase: 'cleaner' },
  { label: 'Painter', emoji: '🎨', phrase: 'painter' },
  { label: 'Tutor', emoji: '📚', phrase: 'tutor' },
];

export default function HomeScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [name, setName] = useState('Guest');
  const [input, setInput] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const pulse = useRef(new Animated.Value(1)).current;
  const { loading, setLoading, setResult, setError, error, priceSort, setPriceSort, setLastSearchText } =
    useBookingStore();
  const submitting = useRef(false);
  const [recording, setRecording] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [contacted, setContacted] = useState<ContactedWorker[]>([]);
  const [filters, setFilters] = useState<SearchFilterState>({
    maxDistanceKm: null,
    minRating: null,
    verifiedOnly: false,
    availableToday: false,
  });
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
    if (q) setInput(String(q));
    getSuggestions(new Date().getHours()).then((sug) =>
      setHighlight(new Set(sug.map((x) => x.service_type.replace(/_/g, ' '))))
    );
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const submit = useCallback(
    async (text: string) => {
      if (!text.trim() || submitting.current) return;
      submitting.current = true;
      setLoading(true);
      setError(null);
      try {
        const session = await getSession();
        if (!session) {
          router.replace('/auth');
          return;
        }
        await addRecentSearch(text.trim());
        setRecent(await getRecentSearches());
        setLastSearchText(text.trim());
        const coords = await getUserCoords();
        const data = await discover(text.trim(), session.userId, session.name, session.phone, {
          userLat: coords.lat,
          userLng: coords.lng,
          priceSort,
          maxDistanceKm: filters.maxDistanceKm,
          minRating: filters.minRating,
          verifiedOnly: filters.verifiedOnly,
          availableToday: filters.availableToday,
          lang,
        });
        setResult(data);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        showToast(t('preview_note'));
        router.push('/results');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Connection error — tap to retry');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setLoading(false);
        submitting.current = false;
      }
    },
    [setLoading, setResult, setError, priceSort, setLastSearchText, filters, lang, t]
  );

  const onPriceSortChange = async (sort: PriceSort) => {
    setPriceSort(sort);
    await persistPriceSort(sort);
  };

  const bookContacted = (w: ContactedWorker) => {
    const cat = w.category.replace(/_/g, ' ');
    const msg = `Mujhe ${cat} chahiye ${w.area} mein — prefer ${w.name}`;
    setInput(msg);
    setSearchFocused(false);
    submit(msg);
  };

  const onMicPress = async () => {
    if (loading) return;
    if (Platform.OS === 'web') {
      setError('Voice works on phone — type or use Try Demo');
      return;
    }
    try {
      if (!recording && !isRecording()) {
        await startRecording();
        setRecording(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      }
      setRecording(false);
      setLoading(true);
      const { base64, mimeType } = await stopRecordingBase64();
      const { text } = await transcribeSpeech(base64, mimeType);
      setInput(text);
      await submit(text);
    } catch (e) {
      setRecording(false);
      setError(e instanceof Error ? e.message : 'Voice failed');
      setLoading(false);
    }
  };

  const gridItems = CHIPS.map((c) => ({
    ...c,
    hot:
      highlight.has(c.phrase) ||
      [...highlight].some((h) => c.phrase.includes(h) || h.includes(c.phrase.split(' ')[0])),
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <DashboardHeader
          name={name}
          onHelp={() => setShowGuide(true)}
          onProfile={() => router.push('/(tabs)/profile')}
          onStatPress={(key) => {
            if (key === 'bookings') router.push('/(tabs)/bookings');
            if (key === 'trace') router.push('/(tabs)/trace');
          }}
        />

        <CurvedSheet style={{ flex: 1 }}>
          <BookingFlowBar step={0} />
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.quickStart}>
            <Text style={styles.quickTitle}>3 steps to book</Text>
            <Text style={styles.quickStep}>
              Describe → AI finds pros → Confirm & review
            </Text>
          </View>

          <TipCard
            tipId="home_try_demo"
            title="New here?"
            message="Tap ⚡ Try Demo below for a full sample booking in one tap — no typing needed."
            actionLabel="Run demo now →"
            onAction={() => {
              setInput(DEMO);
              submit(DEMO);
            }}
          />

          <View style={styles.micSection}>
            <View style={styles.micFrame}>
              <Animated.View style={[styles.pulseRing, styles.ring1, { transform: [{ scale: pulse }] }]} />
              <Animated.View style={[styles.pulseRing, styles.ring2]} />
              <Pressable onPress={onMicPress} disabled={loading}>
                <LinearGradient
                  colors={recording ? [colors.rose, '#C94A6A'] : [...gradients.mic]}
                  style={[styles.micBtn, shadows.soft]}
                >
                  <Text style={styles.micSvg}>{recording ? '⏹' : '🎤'}</Text>
                </LinearGradient>
              </Pressable>
            </View>
            <Text style={styles.micHint}>
              {recording ? (
                <Text style={styles.recordingHint}>🔴 Listening… tap ⏹ when done</Text>
              ) : (
                <>
                  Tap mic — <Text style={styles.micHintAccent}>Google speech-to-text</Text>
                  {Platform.OS === 'web' ? ' (phone only)' : ''}
                </>
              )}
            </Text>
          </View>

          <View style={styles.searchBlock}>
            <SearchFilters value={filters} onChange={setFilters} />
            <InputField
              label={t('home_title')}
              icon="✏️"
              placeholder={t('home_placeholder')}
              value={input}
              onChangeText={setInput}
              multiline
              editable={!loading}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
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
            <PriceSortChips value={priceSort} onChange={onPriceSortChange} />
            <View style={styles.btnRow}>
              <Button
                label={`⚡ ${t('try_demo')}`}
                variant="ghost"
                onPress={() => {
                  setInput(DEMO);
                  setTimeout(() => submit(DEMO), 400);
                }}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <Button
                label={`📍 ${t('book_now')}`}
                onPress={() => {
                  if (!input.trim()) {
                    showToast('Type a request or tap Try Demo');
                    return;
                  }
                  submit(input);
                }}
                disabled={loading}
                style={{ flex: 1 }}
              />
            </View>
            <ExamplePhrases
              onSelect={(text) => {
                setInput(text);
                showToast('Phrase added — tap Book Now');
              }}
            />
          </View>

          <View style={styles.section}>
            <SecLabel>Popular services</SecLabel>
            <ServiceGrid
              items={gridItems}
              onSelect={(phrase) => {
                setInput(`I need a ${phrase} in G-13`);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                showToast('Service selected — tap Book Now');
              }}
            />
          </View>

          {error ? (
            <Pressable onPress={() => submit(input)} style={styles.errorBox}>
              <Text style={styles.errorTitle}>Could not connect</Text>
              <Text style={styles.error}>{error}</Text>
              <Text style={styles.errorRetry}>Tap to retry</Text>
            </Pressable>
          ) : null}

          </ScrollView>
        </CurvedSheet>
        <ShimmerOverlay visible={loading} />
        <OnboardingModal visible={showGuide} onClose={() => setShowGuide(false)} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.violetDeep },
  scroll: { paddingBottom: 110, paddingTop: spacing.sm },
  quickStart: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text3,
    marginBottom: 4,
    fontFamily: fonts.body,
  },
  quickStep: { fontSize: 12, color: colors.text2, lineHeight: 18, fontFamily: fonts.body },
  micSection: { alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.lg },
  micFrame: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(123,94,167,0.25)',
  },
  ring1: { width: 128, height: 128 },
  ring2: { width: 148, height: 148, borderColor: 'rgba(123,94,167,0.14)' },
  micBtn: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  micSvg: { fontSize: 34 },
  micHint: { fontSize: 12, color: colors.text3, marginTop: 10, fontFamily: fonts.body },
  micHintAccent: { color: colors.violetBright },
  recordingHint: { color: colors.rose, fontWeight: '700' },
  searchBlock: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  section: { marginTop: spacing.lg },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
  },
  pillText: { fontSize: 12, color: colors.text3, fontFamily: fonts.body, maxWidth: 200 },
  errorBox: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.roseSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.3)',
  },
  errorTitle: { color: colors.rose, fontWeight: '700', marginBottom: 4, fontFamily: fonts.body },
  error: { color: colors.text2, fontSize: 13, fontFamily: fonts.body },
  errorRetry: { color: colors.violetBright, fontSize: 12, marginTop: 8, fontWeight: '600', fontFamily: fonts.body },
});
