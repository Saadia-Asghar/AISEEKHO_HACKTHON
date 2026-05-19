/** True when Clerk publishable key is set (real SMS OTP via Clerk). */

export function isClerkConfigured(): boolean {
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!key) return false;
  if (key.includes('xxxx') || key.includes('your_')) return false;
  return key.startsWith('pk_test_') || key.startsWith('pk_live_');
}

export function getClerkPublishableKey(): string | undefined {
  if (!isClerkConfigured()) return undefined;
  return process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!.trim();
}
