import axios from 'axios';
import { Provider, Booking } from '../../../shared/types';
import { useAppStore } from '../store/appStore';

// For local testing on a physical device, this might need to be your PC's IP address.
const BACKEND_URL = "http://localhost:8000";
const DEMO_MODE = true;

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000, // 15 second timeout as requested
});

// Hardcoded mock response for demo mode
const DEMO_RESPONSE = {
  booking: {
    booking_id: "BK-20250516-0042",
    confirmation_message: "Aapki booking confirm ho gayi! Ali AC Services kal subah 10 baje aayega.",
    provider: {
      provider_id: "PRV-ali-ac-001",
      name: "Ali AC Services",
      service_categories: ["ac_repair"],
      location: { lat: 33.6901, lng: 73.0523, area: "G-13, Islamabad" },
      rating: 4.8,
      is_available: true,
      price_tier: "medium",
      phone: "+92-300-1234567",
      experience_years: 8
    },
    appointment_time: "2025-05-17T10:00:00Z",
    estimated_cost_pkr: 2500
  },
  agent_trace: [
    { step_number: 1, agent_name: "IntentAgent", action: "parse_intent", input: "Mujhe kal subah G-13 mein AC technician chahiye", output: { service_type: "ac_repair", location: "G-13", time_slot: "tomorrow 10am", urgency_level: "scheduled", language_detected: "roman_ur" }, duration_ms: 1240 },
    { step_number: 2, agent_name: "DiscoveryAgent", action: "find_providers", input: { service_type: "ac_repair", location: "G-13" }, output: "5 providers found within 8km radius", duration_ms: 890 },
    { step_number: 3, agent_name: "RankingAgent", action: "score_providers", input: "5 candidates", output: "Ali AC — score 0.87 (dist:2.1km, rating:4.8★, available:yes)", duration_ms: 340 },
    { step_number: 4, agent_name: "DecisionAgent", action: "select_best", input: "top 3 ranked providers", output: "Selected: Ali AC Services — closest high-rated available provider", duration_ms: 1100 },
    { step_number: 5, agent_name: "BookingAgent", action: "create_booking", input: "Ali AC + user USR-aisha-001", output: "booking_id: BK-20250516-0042 — Firestore write successful", duration_ms: 720 },
    { step_number: 6, agent_name: "FollowUpAgent", action: "schedule_reminder", input: "appointment: 2025-05-17T10:00:00Z", output: "Reminder set for 09:00 AM tomorrow (T-60min)", duration_ms: 210 }
  ],
  total_duration_ms: 4500,
  status: "success"
};

export const api = {
  sendRequest: async (userInput: string, lat: number, lng: number, userId: string) => {
    if (DEMO_MODE) {
      // Wait initial 1 second before doing anything
      await new Promise(r => setTimeout(r, 1000));
      
      const store = useAppStore.getState();
      let currentTrace: any[] = [];
      
      // Simulate step-by-step reveal
      for (const step of DEMO_RESPONSE.agent_trace) {
        await new Promise(r => setTimeout(r, 500));
        currentTrace = [...currentTrace, step];
        store.setAgentTrace(currentTrace);
      }
      
      await new Promise(r => setTimeout(r, 500));
      return DEMO_RESPONSE;
    }

    try {
      const response = await apiClient.post('/api/v1/request', {
        user_input: userInput,
        user_lat: lat,
        user_lng: lng,
        user_id: userId,
      });
      return response.data;
    } catch (error: any) {
      console.error("API sendRequest error:", error);
      if (error.response) {
        throw new Error(error.response.data?.detail?.error || error.message);
      } else if (error.request) {
        throw new Error("Network error — please check your connection");
      } else {
        throw new Error("An unexpected error occurred");
      }
    }
  },

  getProviders: async (serviceType?: string): Promise<Provider[]> => {
    if (DEMO_MODE) {
      await new Promise(r => setTimeout(r, 800));
      return [DEMO_RESPONSE.booking.provider as any];
    }
    try {
      const params = serviceType ? { service_type: serviceType } : {};
      const response = await apiClient.get('/api/v1/providers', { params });
      return response.data;
    } catch (error: any) {
      console.error("API getProviders error:", error);
      if (error.request && !error.response) {
        throw new Error("Network error — please check your connection");
      }
      throw new Error("Failed to fetch providers");
    }
  },

  getBooking: async (bookingId: string): Promise<Booking> => {
    if (DEMO_MODE) {
      return DEMO_RESPONSE.booking as any;
    }
    try {
      const response = await apiClient.get(`/api/v1/bookings/${bookingId}`);
      return response.data;
    } catch (error: any) {
      console.error("API getBooking error:", error);
      if (error.request && !error.response) {
        throw new Error("Network error — please check your connection");
      }
      throw new Error("Failed to fetch booking details");
    }
  }
};
