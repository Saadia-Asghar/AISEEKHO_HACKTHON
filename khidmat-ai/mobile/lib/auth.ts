import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifyAuthChange } from './authEvents';

const TOKEN = 'khidmat_token';
const USER_ID = 'khidmat_user_id';
const NAME = 'khidmat_name';
const PHONE = 'khidmat_phone';
const LANG = 'lang';

export type Session = { token: string; userId: string; name: string; phone: string };

export async function persistSession(session: Session) {
  await AsyncStorage.multiSet([
    [TOKEN, session.token],
    [USER_ID, session.userId],
    [NAME, session.name],
    [PHONE, session.phone],
  ]);
  notifyAuthChange();
  return session;
}

/** @deprecated Use persistSession after API verify */
export async function saveSession(phone: string, name = 'Guest') {
  return persistSession({
    token: 'mock',
    userId: `usr_${phone.replace(/\D/g, '')}`,
    name,
    phone,
  });
}

export async function getSession(): Promise<Session | null> {
  const [[, token], [, userId], [, name], [, phone]] = await AsyncStorage.multiGet([
    TOKEN,
    USER_ID,
    NAME,
    PHONE,
  ]);
  if (!token || !userId) return null;
  return { token, userId, name: name || 'Guest', phone: phone || '' };
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN, USER_ID, NAME, PHONE]);
  notifyAuthChange();
}

/** Clear session + app state and go to sign-in (works on web; Alert.alert does not). */
export async function logout() {
  const { router } = await import('expo-router');
  const { useBookingStore } = await import('./store');
  const { isClerkConfigured } = await import('./clerkConfig');
  if (isClerkConfigured()) {
    try {
      const { getClerkInstance } = await import('@clerk/clerk-expo');
      await getClerkInstance()?.signOut();
    } catch {
      /* Clerk may not be mounted */
    }
  }
  await clearSession();
  useBookingStore.getState().reset();
  router.replace('/auth');
}

export async function getLang(): Promise<'en' | 'ur'> {
  const v = await AsyncStorage.getItem(LANG);
  return v === 'ur' ? 'ur' : 'en';
}

export async function setLang(lang: 'en' | 'ur') {
  await AsyncStorage.setItem(LANG, lang);
}
