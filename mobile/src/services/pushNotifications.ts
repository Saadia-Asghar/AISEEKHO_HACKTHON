import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function notifyBookingConfirmed(bookingId: string, providerName: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'HazirAI — Booking confirmed',
      body: `${providerName} · ${bookingId}`,
    },
    trigger: null,
  });
}

export async function scheduleReminder(slotIso: string, bookingId: string) {
  const slot = new Date(slotIso);
  const remind = new Date(slot.getTime() - 60 * 60 * 1000);
  if (remind <= new Date()) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'HazirAI — Appointment in 1 hour',
      body: `Booking ${bookingId} starts soon.`,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: remind },
  });
}
