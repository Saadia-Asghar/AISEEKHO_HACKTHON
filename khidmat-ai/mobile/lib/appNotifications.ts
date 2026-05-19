import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { showToast } from './toastStore';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  channel: 'booking' | 'reminder' | 'payment' | 'sms' | 'whatsapp' | 'system';
  read: boolean;
};

type NotificationState = {
  items: AppNotification[];
  hydrated: boolean;
  add: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & { id?: string }) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
  hydrate: () => Promise<void>;
  unreadCount: () => number;
};

const STORAGE_KEY = 'khidmat_app_notifications';
const timers = new Map<string, ReturnType<typeof setTimeout>>();

async function persist(items: AppNotification[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 40)));
  } catch {
    /* ignore */
  }
}

export const useAppNotifications = create<NotificationState>((set, get) => ({
  items: [],
  hydrated: false,
  add: (n) => {
    const entry: AppNotification = {
      id: n.id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: n.title,
      body: n.body,
      channel: n.channel,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const items = [entry, ...get().items].slice(0, 40);
    set({ items });
    void persist(items);
    return entry;
  },
  markRead: (id) => {
    const items = get().items.map((x) => (x.id === id ? { ...x, read: true } : x));
    set({ items });
    void persist(items);
  },
  markAllRead: () => {
    const items = get().items.map((x) => ({ ...x, read: true }));
    set({ items });
    void persist(items);
  },
  remove: (id) => {
    const items = get().items.filter((x) => x.id !== id);
    set({ items });
    void persist(items);
  },
  clearAll: () => {
    set({ items: [] });
    void persist([]);
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppNotification[];
        set({ items: parsed, hydrated: true });
        return;
      }
    } catch {
      /* ignore */
    }
    set({ hydrated: true });
  },
  unreadCount: () => get().items.filter((x) => !x.read).length,
}));

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  if (Platform.OS !== 'web') {
    try {
      const Notifications = require('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }
  return false;
}

function showSystemNotification(title: string, body: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch {
        /* ignore */
      }
    }
    return;
  }
  if (Platform.OS !== 'web') {
    try {
      const Notifications = require('expo-notifications');
      void Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null,
      });
    } catch {
      /* ignore */
    }
  }
}

export function pushInAppNotification(
  title: string,
  body: string,
  channel: AppNotification['channel'] = 'system',
  options?: { toast?: boolean }
) {
  useAppNotifications.getState().add({ title, body, channel });
  if (options?.toast !== false) showToast(`🔔 ${title}`);
  showSystemNotification(title, body);
}

export function scheduleLocalNotification(
  title: string,
  body: string,
  delaySeconds: number,
  channel: AppNotification['channel'] = 'reminder'
) {
  const id = `sched-${Date.now()}`;
  const prev = timers.get(id);
  if (prev) clearTimeout(prev);

  const ms = Math.max(1, delaySeconds) * 1000;
  const handle = setTimeout(() => {
    timers.delete(id);
    pushInAppNotification(title, body, channel);

    if (Platform.OS !== 'web') {
      try {
        const Notifications = require('expo-notifications');
        void Notifications.scheduleNotificationAsync({
          content: { title, body, sound: true },
          trigger: null,
        });
      } catch {
        /* ignore */
      }
    }
  }, ms);
  timers.set(id, handle);
  return id;
}

/** After successful payment — immediate alerts + reminder before visit. */
export async function onBookingConfirmed(opts: {
  bookingId: string;
  providerName: string;
  serviceLabel: string;
  slot: string;
  apiNotifications?: Array<{
    channel: string;
    status?: string;
    preview?: string;
    scheduled_at?: string;
  }>;
}) {
  await requestNotificationPermission();

  pushInAppNotification(
    'Booking confirmed',
    `${opts.serviceLabel} with ${opts.providerName} · ${opts.bookingId}`,
    'booking',
    { toast: false }
  );

  for (const n of opts.apiNotifications ?? []) {
    const ch =
      n.channel === 'whatsapp'
        ? 'whatsapp'
        : n.channel === 'sms'
          ? 'sms'
          : n.channel === 'fcm' || n.channel === 'fcm_simulated'
            ? 'reminder'
            : 'system';
    const preview = n.preview || n.status || 'Sent';
    useAppNotifications.getState().add({
      title: n.channel === 'whatsapp' ? 'WhatsApp' : n.channel === 'sms' ? 'SMS' : 'KhidmatAI',
      body: preview,
      channel: ch,
    });
  }

  const reminderSec = Platform.OS === 'web' ? 30 : 3600;
  scheduleLocalNotification(
    'KhidmatAI reminder',
    `Your ${opts.serviceLabel} with ${opts.providerName} is coming up (${opts.slot}).`,
    reminderSec,
    'reminder'
  );
}

export async function scheduleVisitReminder(opts: {
  serviceLabel: string;
  providerName: string;
  slot: string;
}) {
  const ok = await requestNotificationPermission();
  if (!ok && Platform.OS !== 'web') {
    showToast('Allow notifications in settings to get reminders');
    return false;
  }

  const delay = Platform.OS === 'web' ? 20 : 3600;
  scheduleLocalNotification(
    'KhidmatAI reminder',
    `Your ${opts.serviceLabel} with ${opts.providerName} is in 1 hour (${opts.slot}).`,
    delay,
    'reminder'
  );
  showToast(Platform.OS === 'web' ? '🔔 Reminder in ~20 seconds' : '🔔 Reminder set for 1 hour before');
  return true;
}

export function initAppNotifications() {
  void useAppNotifications.getState().hydrate();

  if (Platform.OS !== 'web') {
    try {
      const Notifications = require('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch {
      /* ignore */
    }
  }
}
