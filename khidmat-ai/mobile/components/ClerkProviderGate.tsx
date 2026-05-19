import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { getClerkPublishableKey, isClerkConfigured } from '../lib/clerkConfig';

type Props = { children: ReactNode };

/** Wraps the app with Clerk when `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is set. */
export default function ClerkProviderGate({ children }: Props) {
  const key = getClerkPublishableKey();
  if (!isClerkConfigured() || !key) {
    return <>{children}</>;
  }
  return (
    <ClerkProvider publishableKey={key} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  );
}
