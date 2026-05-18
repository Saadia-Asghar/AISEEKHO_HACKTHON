import { create } from 'zustand';

type UserState = {
  userId: string | null;
  displayName: string | null;
  phone: string | null;
  language: 'en' | 'ur';
  isReady: boolean;
  setUser: (userId: string, displayName: string, phone?: string | null, language?: 'en' | 'ur') => void;
  setLanguage: (language: 'en' | 'ur') => void;
  clearUser: () => void;
  setReady: (v: boolean) => void;
};

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  displayName: null,
  phone: null,
  language: 'ur',
  isReady: false,
  setUser: (userId, displayName, phone = null, language = 'ur') =>
    set({ userId, displayName, phone, language, isReady: true }),
  setLanguage: (language) => set({ language }),
  clearUser: () => set({ userId: null, displayName: null, phone: null, language: 'ur' }),
  setReady: (isReady) => set({ isReady }),
}));
