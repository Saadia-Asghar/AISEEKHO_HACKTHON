import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  confirmPayment,
  createBookingFromDiscover,
  type PaymentMethod,
  type ProviderSummary,
} from '../api/client';
import { getSession } from './auth';
import { useBookingStore } from './store';
import { showToast } from './toastStore';

export function getSelectedProvider(): ProviderSummary | null {
  const { result, selectedProviderId } = useBookingStore.getState();
  if (!result) return null;
  const id = selectedProviderId || result.recommended?.id;
  if (!id) return null;
  const pool = [
    result.recommended,
    ...(result.candidates ?? []),
    ...(result.top_three ?? []),
    ...(result.top_rated ?? []),
  ].filter(Boolean) as ProviderSummary[];
  return pool.find((p) => p.id === id) ?? result.recommended ?? null;
}

/** Tap a card — highlight selection, no API call yet. */
export async function selectProvider(providerId: string): Promise<void> {
  const { setSelectedProviderId, result, setResult } = useBookingStore.getState();
  setSelectedProviderId(providerId);
  await Haptics.selectionAsync();
  if (result?.booking) {
    setResult({ ...result, booking: undefined, payment: undefined, preview: true });
  }
}

/** Results → Payment (booking created only when user pays). */
export function goToCheckout(): boolean {
  const { result, selectedProviderId } = useBookingStore.getState();
  if (!result?.session_id) {
    showToast('Search on Home first');
    router.replace('/');
    return false;
  }
  if (!selectedProviderId) {
    showToast('Tap a provider to select them');
    return false;
  }
  router.push('/payment');
  return true;
}

/** Payment screen — create booking + confirm payment in one step. */
export async function completeCheckout(method: PaymentMethod): Promise<boolean> {
  const { result, selectedProviderId, setResult } = useBookingStore.getState();
  const providerId = selectedProviderId || result?.recommended?.id;
  if (!result?.session_id || !providerId) {
    showToast('Session expired — search again');
    router.replace('/');
    return false;
  }

  const session = await getSession();
  if (!session) {
    router.replace('/auth');
    return false;
  }

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

  if (result.booking?.payment_status === 'paid' || result.payment?.status === 'paid') {
    router.replace('/booking-confirm');
    return true;
  }

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

  const payConfirm = await confirmPayment({
    payment_id: full.payment.payment_id,
    booking_id: full.booking.booking_id,
    method,
    user_id: session.userId,
    customer_phone: session.phone,
    stripe_payment_intent_id: full.payment.stripe_payment_intent_id,
  });

  const mergedNotifications = [
    ...(full.notifications ?? []),
    ...(payConfirm.notifications ?? []),
  ];

  setResult({
    ...full,
    booking: { ...full.booking, status: 'CONFIRMED', payment_status: 'paid' },
    payment: { ...full.payment, status: 'paid' },
    notifications: mergedNotifications.length ? mergedNotifications : full.notifications,
  });
  router.replace('/booking-confirm');
  return true;
}

/** @deprecated use selectProvider + goToCheckout + completeCheckout */
export async function bookSelectedProvider(providerId: string): Promise<boolean> {
  await selectProvider(providerId);
  return goToCheckout();
}
