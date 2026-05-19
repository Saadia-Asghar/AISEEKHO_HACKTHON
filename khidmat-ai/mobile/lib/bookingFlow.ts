import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { createBookingFromDiscover } from '../api/client';
import { getSession } from './auth';
import { useBookingStore } from './store';
import { showToast } from './toastStore';

/** Create booking for chosen provider and go to payment. */
export async function bookSelectedProvider(providerId: string): Promise<boolean> {
  const { result, setResult, setSelectedProviderId } = useBookingStore.getState();
  if (!result?.session_id) {
    showToast('Search for a service on Home first');
    router.replace('/');
    return false;
  }
  const session = await getSession();
  if (!session) {
    router.replace('/auth');
    return false;
  }
  setSelectedProviderId(providerId);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  const full = await createBookingFromDiscover(
    result.session_id,
    providerId,
    session.userId,
    session.name,
    session.phone
  );
  setResult(full);
  if (!full.booking?.booking_id || !full.payment?.payment_id) {
    showToast('Could not create booking — try again');
    return false;
  }
  router.push('/payment');
  return true;
}
