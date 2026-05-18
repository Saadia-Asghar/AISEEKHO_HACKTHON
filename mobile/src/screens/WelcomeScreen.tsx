import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createUser } from '../api/client';
import { saveStoredUser } from '../storage/userStorage';
import { useUserStore } from '../store/useUserStore';
import { colors } from '../constants/theme';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const setUser = useUserStore((s) => s.setUser);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onContinue = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await createUser(name.trim());
      await saveStoredUser(user.user_id, user.display_name);
      setUser(user.user_id, user.display_name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + 40 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <Text style={styles.badge}>KhidmatAI</Text>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>
        Book local workers in Urdu, Roman Urdu, or English. Rate workers and save favorites for faster rebooking.
      </Text>

      <Text style={styles.label}>Your name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Aisha"
        placeholderTextColor={colors.dim}
        autoCapitalize="words"
      />

      <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onContinue} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Setting up…' : 'Get started'}</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.steps}>
        <Text style={styles.stepsTitle}>How it works</Text>
        <Text style={styles.step}>1. Describe your need in any language</Text>
        <Text style={styles.step}>2. AI agents find & rank nearby workers</Text>
        <Text style={styles.step}>3. Book, rate, and save workers you trust</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  badge: { color: colors.primary, fontWeight: '700', marginBottom: 8 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800' },
  subtitle: { color: colors.muted, marginTop: 12, lineHeight: 22, marginBottom: 28 },
  label: { color: colors.dim, marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 16 },
  error: { color: colors.error, marginTop: 12 },
  steps: { marginTop: 40, padding: 16, backgroundColor: colors.card, borderRadius: 12 },
  stepsTitle: { color: colors.primary, fontWeight: '700', marginBottom: 12 },
  step: { color: colors.muted, marginBottom: 8, lineHeight: 20 },
});
