import Constants from 'expo-constants';

function readClerkKey(): string {
  const fromProcess = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (fromProcess) return fromProcess;
  const extra = Constants.expoConfig?.extra as { clerkPublishableKey?: string } | undefined;
  return extra?.clerkPublishableKey?.trim() || '';
}

/** True when Clerk publishable key is set (real SMS OTP via Clerk). */
export function isClerkConfigured(): boolean {
  const key = readClerkKey();
  if (!key) return false;
  if (key.includes('xxxx') || key.includes('your_')) return false;
  return key.startsWith('pk_test_') || key.startsWith('pk_live_');
}

export function getClerkPublishableKey(): string | undefined {
  if (!isClerkConfigured()) return undefined;
  return readClerkKey();
}
