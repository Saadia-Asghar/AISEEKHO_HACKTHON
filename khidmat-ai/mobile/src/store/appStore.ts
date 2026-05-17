import { create } from 'zustand';
import { Provider, Booking, AgentStep } from '../../../shared/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

interface AppState {
  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;

  // Agent pipeline state
  isProcessing: boolean;
  agentTrace: AgentStep[];
  currentStep: string;
  setProcessing: (isProcessing: boolean) => void;
  setAgentTrace: (steps: AgentStep[]) => void;
  setCurrentStep: (step: string) => void;

  // Booking result
  booking: Booking | null;
  providers: Provider[];
  selectedProvider: Provider | null;
  setBooking: (booking: Booking | null) => void;
  setProviders: (providers: Provider[]) => void;
  setSelectedProvider: (p: Provider | null) => void;

  // User
  userId: string;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;

  // UI
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),

  isProcessing: false,
  agentTrace: [],
  currentStep: '',
  setProcessing: (isProcessing) => set({ isProcessing }),
  setAgentTrace: (agentTrace) => set({ agentTrace }),
  setCurrentStep: (currentStep) => set({ currentStep }),

  booking: null,
  providers: [],
  selectedProvider: null,
  setBooking: (booking) => set({ booking }),
  setProviders: (providers) => set({ providers }),
  setSelectedProvider: (selectedProvider) => set({ selectedProvider }),

  userId: "demo-user-001",
  userLocation: null,
  setUserLocation: (userLocation) => set({ userLocation }),

  activeScreen: 'Home',
  setActiveScreen: (activeScreen) => set({ activeScreen }),
}));
