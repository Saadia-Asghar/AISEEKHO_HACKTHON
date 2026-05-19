import { create } from 'zustand';
import type { DiscoverResult, PriceSort } from '../api/client';
import type { SearchFilterState } from '../components/SearchFilters';

export const defaultSearchFilters: SearchFilterState = {
  maxDistanceKm: null,
  minRating: null,
  verifiedOnly: false,
  availableToday: false,
};

type State = {
  result: DiscoverResult | null;
  loading: boolean;
  error: string | null;
  priceSort: PriceSort;
  lastSearchText: string | null;
  searchFilters: SearchFilterState;
  selectedProviderId: string | null;
  setResult: (r: DiscoverResult | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setPriceSort: (s: PriceSort) => void;
  setLastSearchText: (t: string | null) => void;
  setSearchFilters: (f: SearchFilterState) => void;
  setSelectedProviderId: (id: string | null) => void;
  reset: () => void;
};

export const useBookingStore = create<State>((set) => ({
  result: null,
  loading: false,
  error: null,
  priceSort: 'smart',
  lastSearchText: null,
  searchFilters: { ...defaultSearchFilters },
  selectedProviderId: null,
  setResult: (result) => set({ result, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setPriceSort: (priceSort) => set({ priceSort }),
  setLastSearchText: (lastSearchText) => set({ lastSearchText }),
  setSearchFilters: (searchFilters) => set({ searchFilters }),
  setSelectedProviderId: (selectedProviderId) => set({ selectedProviderId }),
  reset: () =>
    set({
      result: null,
      error: null,
      loading: false,
      lastSearchText: null,
      selectedProviderId: null,
    }),
}));

/** Bookings API returns `booking_id`; normalize for UI actions. */
export function bookingRowId(row: { booking_id?: string; id?: string }): string {
  return row.booking_id || row.id || '';
}
