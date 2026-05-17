export interface Provider {
  provider_id: string;
  name: string;
  service_categories: string[];
  location: {
    lat: number;
    lng: number;
    area: string;
  };
  rating: number;
  is_available: boolean;
  price_tier: 'low' | 'medium' | 'high';
  phone: string;
  experience_years: number;
}

export interface Booking {
  booking_id: string;
  user_id: string;
  provider_id: string;
  service_type: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  appointment_time: string;
  original_request: string;
  estimated_cost_pkr: number;
  agent_trace: AgentTrace;
}

export interface AgentTrace {
  steps: AgentStep[];
  duration_ms: number;
}

export interface AgentStep {
  step_number: number;
  agent_name: string;
  action: string;
  input: any;
  output: any;
  timestamp?: string;
  duration_ms: number;
}

export interface IntentResult {
  service_type: string;
  location: string;
  time_slot: string;
  urgency_level: 'asap' | 'scheduled' | 'flexible';
  language_detected: 'en' | 'ur' | 'roman_ur';
  clarification_needed?: boolean;
  clarification_question?: string;
}
