import axios, { AxiosError } from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

function parseError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ detail?: string }>;
    return ax.response?.data?.detail || ax.message || 'Request failed';
  }
  return err instanceof Error ? err.message : 'Request failed';
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (attempt === retries) break;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw new Error(parseError(last));
}

export type ProviderProfile = {
  id: string;
  name: string;
  category: string;
  area: string;
  phone: string;
  rating: number;
  review_count?: number;
  bio?: string;
  verified?: boolean;
  price_min_pkr?: number;
  price_max_pkr?: number;
  distance_km?: number;
  photo_url?: string;
};

export type OrchestrationResult = {
  session_id: string;
  intent: {
    service_label: string;
    location: string;
    time_expression: string;
    language: string;
    urgency?: boolean;
  };
  recommended: ProviderProfile & { phone: string };
  top_three: ProviderProfile[];
  booking: {
    booking_id: string;
    provider_id: string;
    provider_name: string;
    slot: string;
    status: string;
    payment_status?: string;
    amount_pkr?: number;
    confirmation_message: string;
    receipt: string;
  };
  payment?: {
    payment_id: string;
    booking_id: string;
    amount_pkr: number;
    method: string;
    status: string;
    instructions?: string;
  };
  follow_up: { status_update: string; reminder_time: string };
  trace: Array<{ agent: string; phase: string; action: string; reasoning: string }>;
  trace_summary?: { outcome: string; steps?: number; human_readable?: boolean };
  rate_booking?: boolean;
  notifications?: Array<{ channel: string; status: string; to: string }>;
};

export async function sendOtp(phone: string) {
  return withRetry(async () => {
    const { data } = await api.post('/auth/otp/send', { phone });
    return data;
  });
}

export async function verifyOtp(phone: string, otp: string, name?: string) {
  return withRetry(async () => {
    const { data } = await api.post<{ token: string; user_id: string; user: { name: string; phone: string; language_pref: string } }>(
      '/auth/otp/verify',
      { phone, otp, name }
    );
    return data;
  });
}

export async function getSuggestions(hour: number) {
  return withRetry(async () => {
    const { data } = await api.get<{ suggestions: Array<{ service_type: string; label: string; label_ur: string }> }>(
      '/api/suggestions',
      { params: { hour } }
    );
    return data;
  });
}

export async function getProvider(id: string, userId?: string) {
  return withRetry(async () => {
    const { data } = await api.get<ProviderProfile>(`/api/providers/${id}`, {
      params: userId ? { user_id: userId } : undefined,
    });
    return data;
  });
}

export async function getProviderReviews(id: string) {
  return withRetry(async () => {
    const { data } = await api.get<{ reviews: Array<{ rating: number; comment?: string; user_name: string }> }>(
      `/api/providers/${id}/reviews`
    );
    return data;
  });
}

export async function orchestrate(
  message: string,
  userId?: string,
  customerName?: string,
  coords?: { lat: number; lng: number } | null,
  customerPhone?: string | null
): Promise<OrchestrationResult> {
  return withRetry(async () => {
    const { data } = await api.post<OrchestrationResult>('/api/orchestrate', {
      message,
      user_id: userId,
      customer_name: customerName,
      user_lat: coords?.lat,
      user_lng: coords?.lng,
      customer_phone: customerPhone,
    });
    return data;
  });
}

export async function submitReview(body: {
  booking_id: string;
  user_id: string;
  provider_id: string;
  rating: number;
  comment?: string;
}) {
  return withRetry(async () => {
    const { data } = await api.post('/api/reviews', body);
    return data;
  });
}

export async function fetchBookings(userId: string, tab: 'upcoming' | 'past' | 'cancelled') {
  return withRetry(async () => {
    const { data } = await api.get<{ bookings: Array<Record<string, unknown>> }>('/api/bookings', {
      params: { user_id: userId, tab },
    });
    return data;
  });
}

export async function cancelBooking(bookingId: string, userId: string) {
  return withRetry(async () => {
    const { data } = await api.patch(`/api/bookings/${bookingId}/cancel`, null, {
      params: { user_id: userId },
    });
    return data;
  });
}

export async function upcomingCount(userId: string) {
  return withRetry(async () => {
    const { data } = await api.get<{ count: number }>('/api/bookings/upcoming/count', {
      params: { user_id: userId },
    });
    return data;
  });
}

export async function updateUserLanguage(userId: string, language_pref: 'en' | 'ur') {
  return withRetry(async () => {
    const { data } = await api.patch(`/api/users/${userId}`, { language_pref });
    return data;
  });
}
