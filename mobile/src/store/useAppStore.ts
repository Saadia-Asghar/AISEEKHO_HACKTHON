import { create } from 'zustand';
import type { OrchestrationResult } from '../api/client';

type AppState = {
  result: OrchestrationResult | null;
  isProcessing: boolean;
  error: string | null;
  pendingMessage: string | null;
  setResult: (r: OrchestrationResult | null) => void;
  setProcessing: (v: boolean) => void;
  setError: (e: string | null) => void;
  setPendingMessage: (msg: string | null) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  result: null,
  isProcessing: false,
  error: null,
  pendingMessage: null,
  setResult: (result) => set({ result, error: null }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),
  setPendingMessage: (pendingMessage) => set({ pendingMessage }),
  reset: () => set({ result: null, error: null, isProcessing: false, pendingMessage: null }),
}));
