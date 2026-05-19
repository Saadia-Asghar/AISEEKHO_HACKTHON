import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, gradients, radius, spacing } from '../constants/theme';
import StatCard from './StatCard';

export default function DashboardHeader({
  name,
  onHelp,
  onProfile,
  onStatPress,
}: {
  name: string;
  onHelp: () => void;
  onProfile: () => void;
  onStatPress?: (key: string) => void;
}) {
  return (
    <LinearGradient colors={[...gradients.hero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Assalamu Alaikum 👋</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={onHelp}>
          <Text>❓</Text>
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onProfile}>
          <Text>👤</Text>
        </Pressable>
      </View>
      <Text style={styles.sub}>Bolein, Hum Karein · Powered by Google</Text>
      <View style={styles.stats}>
        <StatCard icon="📋" value="Jobs" label="Bookings" onPress={() => onStatPress?.('bookings')} />
        <StatCard icon="🧠" value="AI" label="Trace" accent={colors.jade} onPress={() => onStatPress?.('trace')} />
        <StatCard icon="⚡" value="24/7" label="Available" accent={colors.amber} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700', fontFamily: fonts.display },
  hello: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: fonts.body },
  name: { color: '#fff', fontSize: 20, fontWeight: '700', fontFamily: fonts.display },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 14,
    fontFamily: fonts.body,
  },
  stats: { flexDirection: 'row', gap: 8 },
});
