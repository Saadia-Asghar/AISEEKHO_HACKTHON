import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import HazirLogo from '../components/HazirLogo';
import { BRAND, TAGLINE, FONT_BOLD, FONT_REGULAR } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

type Props = { onDone: () => void };

export default function SplashScreen({ onDone }: Props) {
  const { colors } = useTheme();

  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style="light" />
      <HazirLogo size={96} />
      <Text style={[styles.brand, { color: colors.text, fontFamily: FONT_BOLD }]}>{BRAND}</Text>
      <Text style={[styles.tagline, { color: colors.muted, fontFamily: FONT_REGULAR }]}>{TAGLINE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  brand: { fontSize: 32, fontWeight: '800', marginTop: 20 },
  tagline: { fontSize: 15, marginTop: 8, textAlign: 'center' },
});
