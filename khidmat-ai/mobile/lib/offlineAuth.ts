import { persistSession } from './auth';

const GUEST_PHONE = '+923000000000';

/** Last-resort session when the public API is down (UI demo; search/booking need a live API). */
export async function persistOfflineGuest(name = 'Guest') {
  return persistSession({
    token: `offline_${Date.now()}`,
    userId: `USR_OFFLINE_${Date.now().toString(36)}`,
    name,
    phone: GUEST_PHONE,
  });
}

export function isOfflineToken(token: string | undefined): boolean {
  return !!token && token.startsWith('offline_');
}
