import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { getSession } from '../../lib/auth';
import { orchestrate, getSuggestions, transcribeSpeech } from '../../api/client';
import { useBookingStore } from '../../lib/store';
import { addRecentSearch, getRecentSearches } from '../../lib/searchHistory';
import ShimmerOverlay from '../../components/ShimmerOverlay';
import SecLabel from '../../components/ui/SecLabel';
import Button from '../../components/ui/Button';
import { isRecording, startRecording, stopRecordingBase64 } from '../../lib/voice';

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
  const [name, setName] = useState('Guest');
  const [input, setInput] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [activeChip, setActiveChip] = useState(0);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const pulse = useRef(new Animated.Value(1)).current;
  const { loading, setLoading, setResult, setError, error } = useBookingStore();
  const submitting = useRef(false);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    getSession().then((s) => s && setName(s.name));
    getRecentSearches().then(setRecent);
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
        const data = await orchestrate(text.trim(), session.userId, session.name, session.phone);
        setResult(data);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.push('/results');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Connection error — tap to retry');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setLoading(false);
        submitting.current = false;
      }
    },
    [setLoading, setResult, setError]
  );

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.homeTop}>
          <View>
            <Text style={styles.greeting}>Assalamu Alaikum 👋</Text>
            <View style={styles.greetingSub}>
              <View style={styles.locDot} />
              <Text style={styles.greetingSubText}>
                {name} · Karachi
              </Text>
            </View>
          </View>
          <Link href="/(tabs)/profile" asChild>
            <Pressable style={styles.gearBtn}>
              <Text style={styles.gearIcon}>⚙️</Text>
            </Pressable>
          </Link>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.micSection}>
            <View style={styles.micFrame}>
              <Animated.View style={[styles.pulseRing, styles.ring1, { transform: [{ scale: pulse }] }]} />
              <Animated.View style={[styles.pulseRing, styles.ring2]} />
              <Pressable onPress={onMicPress} disabled={loading}>
                <Animated.View style={[styles.micBtn, recording && styles.micBtnRec]}>
                  <Text style={styles.micSvg}>{recording ? '⏹' : '🎤'}</Text>
                </Animated.View>
              </Pressable>
            </View>
            <Text style={styles.micHint}>
              Tap mic — <Text style={styles.micHintAccent}>Google speech-to-text</Text>
            </Text>
          </View>

          <View style={styles.searchBlock}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mujhe AC repair karwana hai ghar mein…"
              placeholderTextColor={colors.text3}
              value={input}
              onChangeText={setInput}
              multiline
              editable={!loading}
            />
            <View style={styles.btnRow}>
              <Button
                label="⚡ Try Demo"
                variant="ghost"
                onPress={() => {
                  setInput(DEMO);
                  setTimeout(() => submit(DEMO), 400);
                }}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <Button label="📍 Book Now" onPress={() => submit(input)} disabled={loading} style={{ flex: 1 }} />
            </View>
          </View>

          <View style={styles.section}>
            <SecLabel>Services</SecLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {CHIPS.map((c, i) => {
                const hot =
                  highlight.has(c.phrase) ||
                  [...highlight].some((h) => c.phrase.includes(h) || h.includes(c.phrase.split(' ')[0]));
                return (
                  <Pressable
                    key={c.label}
                    style={[styles.chip, (activeChip === i || hot) && styles.chipOn]}
                    onPress={() => {
                      setActiveChip(i);
                      setInput(`I need a ${c.phrase} in G-13`);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.chipText, (activeChip === i || hot) && styles.chipTextOn]}>
                      {c.emoji} {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {recent.length > 0 ? (
            <View style={styles.section}>
              <SecLabel>Recent Searches</SecLabel>
              <View style={styles.pillsRow}>
                {recent.map((r) => (
                  <Pressable key={r} style={styles.pill} onPress={() => setInput(r)}>
                    <Text style={styles.pillText} numberOfLines={1}>
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {error ? (
            <Pressable onPress={() => submit(input)}>
              <Text style={styles.error}>{error}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
        <ShimmerOverlay visible={loading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  homeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  greeting: { fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.text },
  greetingSub: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.jade },
  greetingSubText: { fontSize: 12, color: colors.text2, fontFamily: fonts.body },
  gearBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: { fontSize: 18 },
  scroll: { paddingBottom: 100 },
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
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#8B6FBD',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  micBtnRec: { backgroundColor: colors.rose },
  micSvg: { fontSize: 32 },
  micHint: { fontSize: 12, color: colors.text3, marginTop: 10, fontFamily: fonts.body },
  micHintAccent: { color: colors.violetBright },
  searchBlock: { paddingHorizontal: spacing.lg },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.r,
    color: colors.text,
    fontSize: 15,
    padding: 14,
    minHeight: 72,
    fontFamily: fonts.body,
    textAlignVertical: 'top',
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  chipsRow: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    marginRight: 8,
  },
  chipOn: { backgroundColor: colors.violetSoft, borderColor: 'rgba(123,94,167,0.35)' },
  chipText: { fontSize: 13, color: colors.text2, fontFamily: fonts.body },
  chipTextOn: { color: colors.violetBright },
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
  error: { color: colors.rose, textAlign: 'center', margin: spacing.lg, fontFamily: fonts.body },
});
