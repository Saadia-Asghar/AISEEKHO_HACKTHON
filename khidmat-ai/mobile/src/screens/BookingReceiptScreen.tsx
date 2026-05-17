import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Snackbar } from 'react-native-paper';
import { useAppStore } from '../store/appStore';
import { colors } from '../constants/colors';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

export default function BookingReceiptScreen() {
  const store = useAppStore();
  const booking = store.booking;
  
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState('');

  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handleAction = (msg: string) => {
    setSnackbarMsg(msg);
    setSnackbarVisible(true);
  };

  if (!booking) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: colors.textSecondary }}>No booking found.</Text>
      </View>
    );
  }

  const p_name = store.selectedProvider?.name || "Provider"; // fallback

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View style={animatedStyle}>
        <Card style={styles.receiptCard}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.logo}>KhidmatAI</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Confirmed</Text>
            </View>
          </View>
          
          <Card.Content>
            <Text style={styles.monoId}>ID: {booking.booking_id}</Text>
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Provider:</Text>
              <Text style={styles.value}>{booking.provider_id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Service:</Text>
              <Text style={styles.value}>{booking.service_type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Time:</Text>
              <Text style={styles.value}>{new Date(booking.appointment_time).toLocaleString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Est. Cost:</Text>
              <Text style={styles.value}>PKR {booking.estimated_cost_pkr}</Text>
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.fakeQr}>
                <Text style={styles.qrText}>{booking.booking_id}</Text>
              </View>
            </View>
          </Card.Content>
          
          <Card.Actions style={styles.actions}>
            <Button icon="calendar" mode="outlined" onPress={() => handleAction('Added to Calendar!')}>Add to Calendar</Button>
            <Button icon="share-variant" mode="contained" buttonColor={colors.brandPrimary} onPress={() => handleAction('Sharing Receipt...')}>Share</Button>
          </Card.Actions>
        </Card>
      </Animated.View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMsg}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBg },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingTop: 30 },
  receiptCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.brandPrimary, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  logo: { color: '#fff', fontWeight: 'bold' },
  statusBadge: { backgroundColor: colors.brandSecondary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  monoId: { fontFamily: 'monospace', fontSize: 16, textAlign: 'center', marginVertical: 16, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { color: colors.textSecondary, fontSize: 16 },
  value: { color: colors.textPrimary, fontSize: 16, fontWeight: '500' },
  qrContainer: { alignItems: 'center', marginVertical: 20 },
  fakeQr: { width: 100, height: 100, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  qrText: { fontSize: 10, color: colors.textSecondary, transform: [{ rotate: '-45deg' }] },
  actions: { justifyContent: 'space-around', padding: 16, borderTopWidth: 1, borderTopColor: '#eee' }
});
