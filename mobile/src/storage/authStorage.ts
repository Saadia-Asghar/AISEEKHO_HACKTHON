import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN = 'hazir_token';
const USER_ID = 'hazir_user_id';
const USER_NAME = 'hazir_user_name';
const USER_PHONE = 'hazir_user_phone';
const ONBOARDING = 'hazir_onboarding_done';

export async function saveAuth(data: { token: string; userId: string; name: string; phone: string }) {
  await AsyncStorage.multiSet([
    [TOKEN, data.token],
    [USER_ID, data.userId],
    [USER_NAME, data.name],
    [USER_PHONE, data.phone],
  ]);
}

export async function loadAuth() {
  const [[, token], [, userId], [, name], [, phone]] = await AsyncStorage.multiGet([
    TOKEN,
    USER_ID,
    USER_NAME,
    USER_PHONE,
  ]);
  if (token && userId) {
    return { token, userId, name: name || 'User', phone: phone || '' };
  }
  return null;
}

export async function clearAuth() {
  await AsyncStorage.multiRemove([TOKEN, USER_ID, USER_NAME, USER_PHONE]);
}

export async function isOnboardingDone() {
  return (await AsyncStorage.getItem(ONBOARDING)) === '1';
}

export async function setOnboardingDone() {
  await AsyncStorage.setItem(ONBOARDING, '1');
}
