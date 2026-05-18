import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import HapticPressable from '../components/HapticPressable';
import HazirLogo from '../components/HazirLogo';
import { useAppStore } from '../store/useAppStore';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { ThemeColors } from '../constants/theme';
import { notifyBookingConfirmed } from '../services/pushNotifications';
import type { HomeStackParamList } from '../navigation/HomeStackNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'BookingConfirm'>;

export default function BookingConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const styles = useThemedStyles(createStyles);
  const result = useAppStore((s) => s.result);
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    if (result?.booking?.booking_id) {
      notifyBookingConfirmed(result.booking.booking_id, result.recommended.name);
    }
  }, [result, scale]);

  if (!result) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No booking found.</Text>
      </View>
    );
  }

  const code = result.booking.booking_id;

  return (
    <View style={styles.root}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={styles.checkWrap}>
          <Text style={styles.check}>✓</Text>
        </View>
      </Animated.View>
      <HazirLogo size={48} />
      <Text style={styles.title}>Booking confirmed!</Text>
      <Text style={styles.muted}>{result.recommended.name}</Text>
      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>Confirmation code</Text>
        <Text style={styles.code}>{code}</Text>
      </View>
      <Text style={styles.note}>A local notification was scheduled. SMS/WhatsApp when APIs are configured.</Text>
      <HapticPressable style={styles.btn} haptic="light" onPress={() => navigation.navigate('Home')}>
        <Text style={styles.btnText}>Back to home</Text>
      </HapticPressable>
      <HapticPressable
        style={[styles.btn, styles.btnGhost]}
        haptic="light"
        onPress={() => navigation.navigate('AgentTrace')}
      >
        <Text style={[styles.btnText, styles.btnGhostText]}>View agent trace</Text>
      </HapticPressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg, padding: 24, alignItems: 'center', justifyContent: 'center' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    checkWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      shadowColor: colors.success,
      shadowOpacity: 0.5,
      shadowRadius: 16,
    },
    check: { color: '#FFF', fontSize: 44, fontWeight: '800' },
    title: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 16 },
    muted: { color: colors.muted, marginTop: 8, textAlign: 'center' },
    codeBox: {
      marginTop: 24,
      padding: 20,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
      width: '100%',
      shadowColor: colors.primary,
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    codeLabel: { color: colors.dim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    code: { color: colors.primary, fontSize: 22, fontWeight: '800', marginTop: 8 },
    note: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 16, lineHeight: 20 },
    btn: {
      marginTop: 20,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 16,
      width: '100%',
      alignItems: 'center',
    },
    btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary, marginTop: 10 },
    btnText: { color: '#FFFFFF', fontWeight: '700' },
    btnGhostText: { color: colors.primary },
  });
