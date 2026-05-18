import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = 'khidmat_user_id';
const USER_NAME_KEY = 'khidmat_user_name';

export async function loadStoredUser(): Promise<{ userId: string; displayName: string } | null> {
  const [userId, displayName] = await Promise.all([
    AsyncStorage.getItem(USER_ID_KEY),
    AsyncStorage.getItem(USER_NAME_KEY),
  ]);
  if (userId && displayName) {
    return { userId, displayName };
  }
  return null;
}

export async function saveStoredUser(userId: string, displayName: string): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(USER_ID_KEY, userId),
    AsyncStorage.setItem(USER_NAME_KEY, displayName),
  ]);
}

export async function clearStoredUser(): Promise<void> {
  await AsyncStorage.multiRemove([USER_ID_KEY, USER_NAME_KEY]);
}
