import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { discover } from '../api/client';
import { getSession } from './auth';
import { getUserCoords } from './location';
import { addRecentSearch } from './searchHistory';
import { useBookingStore } from './store';
import { showToast } from './toastStore';
import type { Lang } from '../constants/i18n';

export function formatCategorySearch(
  template: string,
  area: string
): string {
  return template.replace(/\{area\}/g, area.trim() || 'G-13');
}

/** Shared discover → results flow for Home and Browse. */
export async function runDiscoverSearch(
  text: string,
  lang: Lang,
  t: (key: string) => string
): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const {
    setLoading,
    setResult,
    setError,
    priceSort,
    searchFilters,
    setLastSearchText,
    setSelectedProviderId,
  } = useBookingStore.getState();

  setLoading(true);
  setError(null);

  try {
    const session = await getSession();
    if (!session) {
      router.replace('/auth');
      return false;
    }
    await addRecentSearch(trimmed);
    setLastSearchText(trimmed);
    const coords = await getUserCoords();
    const data = await discover(trimmed, session.userId, session.name, session.phone, {
      userLat: coords.lat,
      userLng: coords.lng,
      priceSort,
      maxDistanceKm: searchFilters.maxDistanceKm,
      minRating: searchFilters.minRating,
      verifiedOnly: searchFilters.verifiedOnly,
      availableToday: searchFilters.availableToday,
      lang,
    });
    setResult(data);
    setSelectedProviderId(data.recommended?.id ?? null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    showToast(t('preview_note'));
    router.push('/results');
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Connection error — tap to retry';
    setError(msg);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    throw e;
  } finally {
    useBookingStore.getState().setLoading(false);
  }
}
