import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

export async function getLang(): Promise<'en' | 'ur'> {
  const v = await AsyncStorage.getItem(LANG);
  return v === 'ur' ? 'ur' : 'en';
}

export async function setLang(lang: 'en' | 'ur') {
  await AsyncStorage.setItem(LANG, lang);
}
