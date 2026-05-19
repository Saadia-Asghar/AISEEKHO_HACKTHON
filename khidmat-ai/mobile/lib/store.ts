import { create } from 'zustand';
import type { DiscoverResult, PriceSort } from '../api/client';

type State = {
  result: DiscoverResult | null;
  loading: boolean;
  error: string | null;
  priceSort: PriceSort;
  lastSearchText: string | null;
  setResult: (r: DiscoverResult | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setPriceSort: (s: PriceSort) => void;
  setLastSearchText: (t: string | null) => void;
  reset: () => void;
};

export const useBookingStore = create<State>((set) => ({
  result: null,
  loading: false,
  error: null,
  priceSort: 'smart',
  lastSearchText: null,
  setResult: (result) => set({ result, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setPriceSort: (priceSort) => set({ priceSort }),
  setLastSearchText: (lastSearchText) => set({ lastSearchText }),
  reset: () => set({ result: null, error: null, loading: false, lastSearchText: null }),
}));
