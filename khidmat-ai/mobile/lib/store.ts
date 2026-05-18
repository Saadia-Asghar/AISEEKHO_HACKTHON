import { create } from 'zustand';
import type { OrchestrateResult } from '../api/client';

type State = {
  result: OrchestrateResult | null;
  loading: boolean;
  error: string | null;
  setResult: (r: OrchestrateResult | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
};

export const useBookingStore = create<State>((set) => ({
  result: null,
  loading: false,
  error: null,
  setResult: (result) => set({ result, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ result: null, error: null, loading: false }),
}));
