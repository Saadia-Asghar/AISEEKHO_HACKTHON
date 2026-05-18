import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { orchestrate, getSuggestions } from '../api/api';
import { useLocation } from '../hooks/useLocation';
import { useTheme } from '../hooks/useTheme';
import { BRAND, TAGLINE, TAGLINE_UR, FONT_BOLD, FONT_REGULAR, RADIUS_XL } from '../constants/theme';
import { useUserStore } from '../store/useUserStore';
import { useAppStore } from '../store/useAppStore';
import { addSearch, getSearchHistory } from '../storage/searchHistory';
import ProviderBottomSheet from '../components/ProviderBottomSheet';
import MicButton from '../components/MicButton';
import HapticPressable from '../components/HapticPressable';
import { SkeletonList } from '../components/Skeleton';
import type { HomeStackParamList } from '../navigation/HomeStackNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { userId, displayName, phone, language } = useUserStore();
  const { setProcessing, setResult, setError, isProcessing } = useAppStore();
  const { coords, refresh: refreshGps } = useLocation();
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [chips, setChips] = useState<Array<{ service_type: string; label: string; label_ur: string }>>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingChips, setLoadingChips] = useState(true);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const tagline = language === 'ur' ? TAGLINE_UR : TAGLINE;

  const loadMeta = useCallback(async () => {
    setLoadingChips(true);
    setLoadError(null);
    try {
      const hour = new Date().getHours();
      const [sug, hist] = await Promise.all([getSuggestions(hour), getSearchHistory()]);
      setChips(sug.suggestions || []);
      setHistory(hist);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load suggestions');
    } finally {
      setLoadingChips(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const pending = useAppStore((s) => s.pendingMessage);
  useEffect(() => {
    if (pending) {
      setMessage(pending);
      useAppStore.getState().setPendingMessage(null);
    }
  }, [pending]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshGps();
    await loadMeta();
    setRefreshing(false);
  };

  const onSubmit = async () => {
    if (!message.trim() || !userId) return;
    setProcessing(true);
    setError(null);
    try {
      await addSearch(message.trim());
      const data = await orchestrate(message.trim(), userId, displayName ?? undefined, coords, phone);
      setResult(data);
      navigation.navigate('Results');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setProcessing(false);
    }
  };

  const error = useAppStore((s) => s.error);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar style="light" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.greet, { color: colors.text, fontFamily: FONT_BOLD }]}>
            {language === 'ur' ? `سلام، ${displayName}` : `Hello, ${displayName}`}
          </Text>
          <Text style={[styles.brand, { color: colors.primary, fontFamily: FONT_BOLD }]}>{BRAND}</Text>
          <Text style={[styles.tag, { color: colors.muted, fontFamily: FONT_REGULAR }]}>{tagline}</Text>

          <HapticPressable
            onPress={refreshGps}
            style={[
              styles.gps,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.primary,
              },
            ]}
          >
            <Text style={{ color: colors.primary, fontSize: 13, fontFamily: FONT_REGULAR }}>
              {coords ? `📍 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : '📍 Tap for live GPS'}
            </Text>
          </HapticPressable>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
                fontFamily: FONT_REGULAR,
              },
            ]}
            multiline
            placeholder={language === 'ur' ? 'آپ کو کون سی خدمت چاہیے؟' : 'What service do you need?'}
            placeholderTextColor={colors.muted}
            value={message}
            onChangeText={setMessage}
          />

          <MicButton onTranscript={setMessage} disabled={isProcessing} language={language} />

          {history.length > 0 ? (
            <>
              <Text style={[styles.section, { color: colors.dim }]}>Recent searches</Text>
              <View style={styles.chipRow}>
                {history.map((h) => (
                  <HapticPressable
                    key={h}
                    style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setMessage(h)}
                  >
                    <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>
                      {h}
                    </Text>
                  </HapticPressable>
                ))}
              </View>
            </>
          ) : null}

          <Text style={[styles.section, { color: colors.dim }]}>Suggested now</Text>
          {loadingChips ? (
            <SkeletonList count={3} />
          ) : loadError ? (
            <HapticPressable onPress={loadMeta}>
              <Text style={{ color: colors.error }}>{loadError} — Tap to retry</Text>
            </HapticPressable>
          ) : (
            <View style={styles.chipRow}>
              {chips.map((c) => (
                <HapticPressable
                  key={c.service_type}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                      shadowOpacity: 0.35,
                      shadowRadius: 8,
                    },
                  ]}
                  onPress={() =>
                    setMessage(
                      language === 'ur'
                        ? `Mujhe ${c.label_ur || c.label} chahiye qareeb`
                        : `I need a ${c.label} nearby`
                    )
                  }
                >
                  <Text style={{ color: '#FFF', fontSize: 12, fontFamily: FONT_SEMIBOLD }}>
                    {language === 'ur' ? c.label_ur : c.label}
                  </Text>
                </HapticPressable>
              ))}
            </View>
          )}

          <HapticPressable
            haptic="medium"
            style={[
              styles.bookBtn,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                opacity: isProcessing ? 0.7 : 1,
              },
            ]}
            onPress={onSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[styles.bookBtnText, { fontFamily: FONT_BOLD }]}>
                {language === 'ur' ? 'ابھی بک کریں' : 'Book now'}
              </Text>
            )}
          </HapticPressable>
          {error ? <Text style={{ color: colors.error, marginTop: 8 }}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
      <ProviderBottomSheet
        providerId={sheetId}
        userId={userId ?? undefined}
        onClose={() => setSheetId(null)}
        onBook={() => navigation.navigate('BookingConfirm')}
      />
    </View>
  );
}

const FONT_SEMIBOLD = 'Inter_600SemiBold';

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  greet: { fontSize: 22, fontWeight: '700' },
  brand: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  tag: { fontSize: 13, marginBottom: 16 },
  gps: {
    padding: 12,
    borderRadius: RADIUS_XL,
    borderWidth: 1,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 2,
  },
  input: { minHeight: 96, borderRadius: RADIUS_XL, padding: 14, borderWidth: 1, fontSize: 16, marginBottom: 4 },
  section: { marginTop: 16, marginBottom: 8, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS_XL, borderWidth: 1, maxWidth: '48%' },
  bookBtn: {
    marginTop: 24,
    padding: 16,
    borderRadius: RADIUS_XL,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  bookBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
