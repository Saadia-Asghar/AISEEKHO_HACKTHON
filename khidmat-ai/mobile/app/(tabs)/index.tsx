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
import { colors, radius, spacing } from '../../constants/theme';
import { getSession } from '../../lib/auth';
import { orchestrate, getSuggestions, transcribeSpeech } from '../../api/client';
import { useBookingStore } from '../../lib/store';
import { addRecentSearch, getRecentSearches } from '../../lib/searchHistory';
import ShimmerOverlay from '../../components/ShimmerOverlay';
import { isRecording, startRecording, stopRecordingBase64 } from '../../lib/voice';

const DEMO = 'Mujhe kal subah G-13 mein AC technician chahiye';
const CHIPS = [
  { label: 'AC Tech', emoji: '⚡', phrase: 'AC technician' },
  { label: 'Plumber', emoji: '🔧', phrase: 'plumber' },
  { label: 'Electrician', emoji: '💡', phrase: 'electrician' },
  { label: 'Cleaner', emoji: '🧹', phrase: 'cleaner' },
  { label: 'Painter', emoji: '🎨', phrase: 'painter' },
  { label: 'Tutor', emoji: '📚', phrase: 'tutor' },
];

export default function HomeScreen() {
  const [name, setName] = useState('Guest');
  const [input, setInput] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
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
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await submit(text);
    } catch (e) {
      setRecording(false);
      setError(e instanceof Error ? e.message : 'Voice failed — type or try again');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.greet}>
            Assalamu Alaikum 👋 {name}
          </Text>
          <Link href="/(tabs)/profile" asChild>
            <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Text style={styles.settings}>⚙️</Text>
            </Pressable>
          </Link>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={onMicPress} disabled={loading}>
            <Animated.View
              style={[
                styles.mic,
                {
                  transform: [{ scale: recording ? 1.12 : pulse }],
                  borderColor: recording ? colors.accent : colors.primary,
                  shadowColor: recording ? colors.accent : colors.primary,
                },
              ]}
            >
              <Text style={styles.micIcon}>{recording ? '⏹' : '🎤'}</Text>
            </Animated.View>
          </Pressable>
          <Text style={styles.micHint}>
            {recording ? 'Recording… tap to stop & search (Gemini)' : 'Tap mic — Google speech-to-text'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="What service do you need?"
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            multiline
            editable={!loading}
          />

          <Pressable
            style={[styles.demoBtn, loading && { opacity: 0.5 }]}
            disabled={loading}
            onPress={() => {
              setInput(DEMO);
              submit(DEMO);
            }}
          >
            <Text style={styles.demoText}>Try Demo</Text>
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {CHIPS.map((c) => (
              <Pressable
                key={c.label}
                style={[
                  styles.chip,
                  (highlight.has(c.phrase) ||
                    highlight.has(c.phrase.replace(' ', '_')) ||
                    [...highlight].some((h) => c.phrase.includes(h) || h.includes(c.phrase.split(' ')[0]))) &&
                    styles.chipHot,
                ]}
                disabled={loading}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const t = `I need a ${c.phrase} in G-13`;
                  setInput(t);
                }}
              >
                <Text style={styles.chipText}>
                  {c.emoji}
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {recent.length > 0 ? (
            <View style={styles.recentRow}>
              {recent.map((r) => (
                <Pressable key={r} style={styles.recentChip} onPress={() => setInput(r)} disabled={loading}>
                  <Text style={styles.recentText} numberOfLines={1}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Pressable
            style={[styles.cta, loading && { opacity: 0.5 }]}
            disabled={loading}
            onPress={() => submit(input)}
          >
            <Text style={styles.ctaText}>Book Now</Text>
          </Pressable>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  greet: { color: colors.text, fontSize: 20, fontWeight: '700', flex: 1 },
  settings: { fontSize: 22 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  mic: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  micIcon: { fontSize: 36 },
  micHint: { color: colors.muted, textAlign: 'center', fontSize: 12, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    color: colors.text,
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
  },
  demoBtn: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  demoText: { color: colors.accent, fontWeight: '600' },
  chipScroll: { marginTop: spacing.md },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipHot: { borderColor: colors.primary, backgroundColor: colors.card },
  chipText: { color: colors.text, fontSize: 13 },
  recentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  recentChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    maxWidth: '100%',
  },
  recentText: { color: colors.muted, fontSize: 12 },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  ctaText: { color: colors.text, fontWeight: '800', fontSize: 17 },
  error: { color: colors.error, marginTop: spacing.md, textAlign: 'center' },
});
