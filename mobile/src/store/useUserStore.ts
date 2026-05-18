import { create } from 'zustand';

type UserState = {
  userId: string | null;
  displayName: string | null;
  phone: string | null;
  clerkId: string | null;
  isReady: boolean;
  setUser: (userId: string, displayName: string, phone?: string | null, clerkId?: string | null) => void;
  clearUser: () => void;
  setReady: (v: boolean) => void;
};

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  displayName: null,
  phone: null,
  clerkId: null,
  isReady: false,
  setUser: (userId, displayName, phone = null, clerkId = null) =>
    set({ userId, displayName, phone, clerkId, isReady: true }),
  clearUser: () => set({ userId: null, displayName: null, phone: null, clerkId: null }),
  setReady: (isReady) => set({ isReady }),
}));
