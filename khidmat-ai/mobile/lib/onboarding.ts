import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEN_ONBOARDING = 'khidmat_seen_onboarding';
const TIP_PREFIX = 'khidmat_tip_dismissed_';

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await AsyncStorage.getItem(SEEN_ONBOARDING)) === '1';
}

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(SEEN_ONBOARDING, '1');
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(SEEN_ONBOARDING);
}

export async function isTipDismissed(tipId: string): Promise<boolean> {
  return (await AsyncStorage.getItem(TIP_PREFIX + tipId)) === '1';
}

export async function dismissTip(tipId: string): Promise<void> {
  await AsyncStorage.setItem(TIP_PREFIX + tipId, '1');
}
