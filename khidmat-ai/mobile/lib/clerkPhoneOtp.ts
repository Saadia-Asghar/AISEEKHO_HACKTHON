import { useCallback, useRef, useState } from 'react';
import {
  getClerkInstance,
  isClerkAPIResponseError,
  useSignIn,
  useSignUp,
} from '@clerk/clerk-expo';

export type ClerkOtpMode = 'signIn' | 'signUp';

function clerkErrorMessage(err: unknown): string {
  if (isClerkAPIResponseError(err)) {
    const first = err.errors[0];
    return first?.longMessage ?? first?.message ?? 'Clerk verification failed';
  }
  if (err instanceof Error) return err.message;
  return 'Clerk verification failed';
}

function isNewUserError(err: unknown): boolean {
  if (!err || typeof err !== 'object' || !('errors' in err)) return false;
  const list = (err as { errors?: { code?: string }[] }).errors ?? [];
  return list.some((e) =>
    ['form_identifier_not_found', 'identifier_not_found', 'user_not_found'].includes(
      e.code ?? '',
    ),
  );
}

/** Clerk phone OTP — requires ClerkProvider ancestor. */
export function useClerkPhoneOtp() {
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const modeRef = useRef<ClerkOtpMode>('signIn');
  const [sending, setSending] = useState(false);

  const sendCode = useCallback(
    async (phoneE164: string) => {
      if (!signInLoaded || !signUpLoaded) {
        throw new Error('Clerk is still loading — try again');
      }
      setSending(true);
      try {
        try {
          await signIn!.create({ identifier: phoneE164 });
          const factors = signIn!.supportedFirstFactors ?? [];
          const phoneFactor = factors.find(
            (f) => f.strategy === 'phone_code' && 'phoneNumberId' in f,
          ) as { strategy: string; phoneNumberId: string } | undefined;
          if (!phoneFactor?.phoneNumberId) {
            throw new Error(
              'Phone OTP is not enabled. In Clerk Dashboard → User & authentication → enable Sign-in with phone.',
            );
          }
          await signIn!.prepareFirstFactor({
            strategy: 'phone_code',
            phoneNumberId: phoneFactor.phoneNumberId,
          });
          modeRef.current = 'signIn';
        } catch (err) {
          if (!isNewUserError(err)) throw err;
          await signUp!.create({ phoneNumber: phoneE164 });
          await signUp!.preparePhoneNumberVerification({ strategy: 'phone_code' });
          modeRef.current = 'signUp';
        }
      } finally {
        setSending(false);
      }
    },
    [signIn, signUp, signInLoaded, signUpLoaded],
  );

  const verifyCode = useCallback(
    async (code: string): Promise<string> => {
      if (!signIn || !signUp) throw new Error('Clerk not ready');

      let sessionId: string | null = null;
      if (modeRef.current === 'signUp') {
        const result = await signUp.attemptPhoneNumberVerification({ code });
        if (result.status !== 'complete' || !result.createdSessionId) {
          throw new Error('Sign-up not complete — check the code and try again');
        }
        sessionId = result.createdSessionId;
      } else {
        const result = await signIn.attemptFirstFactor({ strategy: 'phone_code', code });
        if (result.status !== 'complete' || !result.createdSessionId) {
          throw new Error('Sign-in not complete — check the code and try again');
        }
        sessionId = result.createdSessionId;
      }

      await setActive!({ session: sessionId });
      const clerkUserId = getClerkInstance()?.user?.id;
      if (!clerkUserId) {
        throw new Error('Clerk user not ready — wait a moment and try Verify again');
      }
      return clerkUserId;
    },
    [signIn, signUp, setActive],
  );

  return {
    sendCode,
    verifyCode,
    sending,
    isReady: signInLoaded && signUpLoaded,
  };
}

export { clerkErrorMessage };
