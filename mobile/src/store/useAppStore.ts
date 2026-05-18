import { create } from 'zustand';
import type { OrchestrationResult } from '../api/client';

type AppState = {
  result: OrchestrationResult | null;
  isProcessing: boolean;
  error: string | null;
  setResult: (r: OrchestrationResult | null) => void;
  setProcessing: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  result: null,
  isProcessing: false,
  error: null,
  setResult: (result) => set({ result, error: null }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),
  reset: () => set({ result: null, error: null, isProcessing: false }),
}));
