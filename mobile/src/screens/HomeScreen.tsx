import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchExamples, orchestrate } from '../api/client';
import { useLocation } from '../hooks/useLocation';
import { useAppStore } from '../store/useAppStore';
import { useUserStore } from '../store/useUserStore';
import { colors } from '../constants/theme';
import type { HomeStackParamList } from '../navigation/HomeStackNavigator';

const DEMO = 'Mujhe kal subah G-13 mein AC technician chahiye';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { userId, displayName, phone } = useUserStore();
  const { coords, loading: gpsLoading, error: gpsError, refresh: refreshGps } = useLocation();
  const { isProcessing, setProcessing, setResult, setError, pendingMessage, setPendingMessage } =
    useAppStore();
  const [message, setMessage] = useState(DEMO);
  const [examples, setExamples] = useState<string[]>([DEMO]);

  useEffect(() => {
    fetchExamples().then(setExamples).catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (pendingMessage) {
        setMessage(pendingMessage);
        setPendingMessage(null);
      }
    }, [pendingMessage, setPendingMessage])
  );

  const onSubmit = useCallback(async () => {
    if (!message.trim() || isProcessing || !userId) return;
    setProcessing(true);
    setError(null);
    try {
      const data = await orchestrate(
        message.trim(),
        userId,
        displayName ?? undefined,
        undefined,
        coords,
        phone
      );
      setResult(data);
      navigation.navigate('Payment');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setProcessing(false);
    }
  }, [message, isProcessing, userId, displayName, phone, coords, navigation, setProcessing, setResult, setError]);

  const error = useAppStore((s) => s.error);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.badge}>KhidmatAI · Antigravity Hackathon 2026</Text>
        <Text style={styles.title}>Hi, {displayName}</Text>
        <Text style={styles.subtitle}>Speak your need. KhidmatAI handles the rest.</Text>

        <Pressable style={styles.gpsBar} onPress={refreshGps}>
          <Text style={styles.gpsText}>
            {gpsLoading
              ? '📍 Getting GPS…'
              : coords
                ? `📍 Live GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                : `📍 ${gpsError || 'GPS off — using sector'}`}
          </Text>
        </Pressable>

        <View style={styles.langRow}>
          <Text style={styles.langChip}>اردو</Text>
          <Text style={styles.langChip}>Roman Urdu</Text>
          <Text style={styles.langChip}>English</Text>
        </View>

        <TextInput
          style={styles.input}
          multiline
          value={message}
          onChangeText={setMessage}
          placeholder="Describe the service you need..."
          placeholderTextColor={colors.dim}
        />

        <View style={styles.chips}>
          {examples.map((ex) => (
            <Pressable key={ex} style={styles.chip} onPress={() => setMessage(ex)}>
              <Text style={styles.chipText} numberOfLines={2}>
                {ex}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.button, isProcessing && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.buttonText}>Run agent pipeline</Text>
          )}
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  badge: { color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.muted, marginTop: 6, marginBottom: 16, lineHeight: 22 },
  gpsBar: {
    backgroundColor: colors.card,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gpsText: { color: colors.primary, fontSize: 13 },
  langRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  langChip: {
    color: colors.muted,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    minHeight: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chips: { gap: 8, marginTop: 12 },
  chip: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 16 },
  error: { color: colors.error, marginTop: 12, lineHeight: 20 },
});
