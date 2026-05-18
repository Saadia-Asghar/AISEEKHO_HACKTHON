import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { submitReview, saveProvider } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import { useUserStore } from '../store/useUserStore';
import { useTheme } from '../hooks/useTheme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { ThemeColors } from '../constants/theme';
import type { HomeStackParamList } from '../navigation/HomeStackNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Rate'>;

const STAR_LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export default function RateScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const result = useAppStore((s) => s.result);
  const userId = useUserStore((s) => s.userId)!;
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [saveAfter, setSaveAfter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!result) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No booking to rate.</Text>
      </View>
    );
  }

  const providerId = result.booking.provider_id || result.recommended.id;

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await submitReview({
        user_id: userId,
        provider_id: providerId,
        booking_id: result.booking.booking_id,
        rating: stars,
        comment: comment || undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (saveAfter) {
        await saveProvider(userId, providerId);
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit rating');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneTitle}>Thank you!</Text>
        <Text style={styles.muted}>Your rating helps recommend better workers next time.</Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.buttonText}>Back to home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.provider}>{result.recommended.name}</Text>
      <Text style={styles.muted}>
        {result.intent.service_label} · {result.booking.booking_id}
      </Text>

      <Text style={styles.label}>How was the service?</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setStars(n)} style={styles.starBtn}>
            <Text style={[styles.star, n <= stars && styles.starActive]}>★</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.starLabel}>{STAR_LABELS[stars - 1]}</Text>

      <TextInput
        style={styles.input}
        placeholder="Optional comment (punctual, skilled…)"
        placeholderTextColor={colors.dim}
        value={comment}
        onChangeText={setComment}
        multiline
      />

      <Pressable style={styles.checkRow} onPress={() => setSaveAfter(!saveAfter)}>
        <Text style={styles.check}>{saveAfter ? '☑' : '☐'}</Text>
        <Text style={styles.checkLabel}>Save this worker to my favorites</Text>
      </Pressable>

      <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Submitting…' : 'Submit rating'}</Text>
      </Pressable>

      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.skip}>Skip for now</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg, padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.bg },
    provider: { color: colors.text, fontSize: 22, fontWeight: '700' },
    muted: { color: colors.muted, marginTop: 6, marginBottom: 24 },
    label: { color: colors.dim, marginBottom: 12 },
    stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
    starBtn: { padding: 8 },
    star: { fontSize: 36, color: colors.border },
    starActive: { color: colors.warning },
    starLabel: { textAlign: 'center', color: colors.primary, fontWeight: '600', marginBottom: 20 },
    input: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      color: colors.text,
      minHeight: 80,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    check: { color: colors.primary, fontSize: 18, marginRight: 10 },
    checkLabel: { color: colors.text, flex: 1 },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#FFFFFF', fontWeight: '700' },
    skip: { color: colors.dim, textAlign: 'center', marginTop: 16 },
    error: { color: colors.error, marginTop: 12 },
    doneTitle: { color: colors.success, fontSize: 24, fontWeight: '700', marginBottom: 8 },
  });
