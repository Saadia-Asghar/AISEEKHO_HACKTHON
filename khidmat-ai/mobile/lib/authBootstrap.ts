import { getSession } from './auth';

const SESSION_TIMEOUT_MS = 2500;

/** Read session without hanging the app on slow/blocked storage (common on web). */
export async function getSessionSafe(): Promise<Awaited<ReturnType<typeof getSession>>> {
  try {
    return await Promise.race([
      getSession(),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), SESSION_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return null;
  }
}
