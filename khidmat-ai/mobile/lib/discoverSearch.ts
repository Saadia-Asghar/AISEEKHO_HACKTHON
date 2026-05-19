import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { discover } from '../api/client';
import { clearSession, getSession } from './auth';
import { getUserCoords } from './location';
import { addRecentSearch } from './searchHistory';
import { priceSortFromFilters } from '../components/SearchFilterDropdown';
import { useBookingStore } from './store';
import { showToast } from './toastStore';
import type { Lang } from '../constants/i18n';

const MIN_LOADING_MS = 700;

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
  const started = Date.now();

  try {
    const session = await getSession();
    if (!session) {
      router.replace('/auth');
      return false;
    }
    await addRecentSearch(trimmed);
    setLastSearchText(trimmed);
    const coords = await getUserCoords();
    const effectiveSort = priceSortFromFilters(searchFilters, priceSort);
    const data = await discover(trimmed, session.userId, session.name, session.phone, {
      userLat: coords.lat,
      userLng: coords.lng,
      priceSort: effectiveSort,
      maxDistanceKm: searchFilters.maxDistanceKm,
      minRating: searchFilters.minRating,
      verifiedOnly: searchFilters.verifiedOnly,
      availableToday: searchFilters.availableToday,
      lang,
    });
    const wait = MIN_LOADING_MS - (Date.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    setResult(data);
    setSelectedProviderId(data.recommended?.id ?? null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/results');
    return true;
  } catch (e) {
    let msg = e instanceof Error ? e.message : 'Connection error — tap to retry';
    if (/invalid|expired token|401/i.test(msg)) {
      await clearSession();
      msg = t('auth_expired');
      router.replace('/auth');
    }
    setError(msg);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    throw e;
  } finally {
    useBookingStore.getState().setLoading(false);
  }
}
