import axios, { AxiosError } from 'axios';
import { router } from 'expo-router';
import { getSession, clearSession } from '../lib/auth';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const session = await getSession();
      if (session?.token && session.token !== 'mock') {
        await clearSession();
        router.replace('/auth');
      }
    }
    return Promise.reject(error);
  }
);

export type ProviderScore = {
  name: string;
  provider_id: string;
  score: number;
  distance_score: number;
  rating_score: number;
  availability_score: number;
  total_score: number;
};

export type ProviderSummary = {
  id: string;
  name: string;
  rating: number;
  distance_km: number;
  phone: string;
  area: string;
  category?: string;
  price_min_pkr?: number;
  price_max_pkr?: number;
  verified?: boolean;
  score?: number;
  score_breakdown?: Record<string, number>;
  lat?: number;
  lng?: number;
  contacted_before?: boolean;
  is_saved?: boolean;
  effective_rating?: number;
};

export type MapMarker = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance_km: number;
  rating: number;
  price_min_pkr?: number;
  price_max_pkr?: number;
  is_recommended?: boolean;
  contacted_before?: boolean;
};

export type ContactedWorker = {
  id: string;
  name: string;
  category: string;
  area: string;
  rating: number;
  phone: string;
  last_booked_at?: string;
  bookings_count?: number;
  price_min_pkr?: number;
  price_max_pkr?: number;
};

export type PriceSort = 'smart' | 'low' | 'high';

export type TypicalJob = {
  title: string;
  title_ur?: string;
  price_min_pkr: number;
  price_max_pkr: number;
};

export type PricingTransparency = {
  estimate_min_pkr: number;
  estimate_max_pkr: number;
  visit_fee_note: string;
  final_price_note: string;
  service_label: string;
  typical_jobs: TypicalJob[];
};

export type DiscoverResult = {
  session_id: string;
  intent: { service_label: string; location: string; time_expression: string; language: string; service_type?: string };
  recommended: ProviderSummary;
  top_three: ProviderSummary[];
  top_rated?: ProviderSummary[];
  candidates?: ProviderSummary[];
  map_markers?: MapMarker[];
  user_location?: { lat: number; lng: number; source: string };
  price_sort?: PriceSort;
  alternatives: ProviderScore[];
  pricing: PricingTransparency;
  preview: boolean;
  trace: Array<{ agent: string; phase: string; action: string; reasoning: string; timestamp?: string }>;
  trace_summary?: { outcome: string };
  booking?: {
    booking_id: string;
    provider_name: string;
    slot: string;
    status: string;
    confirmation_message: string;
    amount_pkr?: number;
    payment_status?: string;
  };
  payment?: {
    payment_id: string;
    amount_pkr: number;
    status: string;
    stripe_payment_intent_id?: string;
    stripe_client_secret?: string;
  };
};

export type OrchestrateResult = DiscoverResult & {
  booking: NonNullable<DiscoverResult['booking']>;
};

function parseErr(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { detail?: string };
    return d?.detail || err.message || 'Connection error — tap to retry';
  }
  return err instanceof Error ? err.message : 'Connection error — tap to retry';
}

export type DiscoverOpts = {
  userLat?: number;
  userLng?: number;
  priceSort?: PriceSort;
  maxDistanceKm?: number | null;
  minRating?: number | null;
  verifiedOnly?: boolean;
  availableToday?: boolean;
  lang?: 'en' | 'ur';
};

export async function discover(
  text: string,
  userId: string,
  name?: string,
  phone?: string,
  opts?: DiscoverOpts
): Promise<DiscoverResult> {
  try {
    const { data } = await api.post<DiscoverResult>('/api/discover', {
      message: text,
      user_id: userId,
      customer_name: name,
      customer_phone: phone,
      user_lat: opts?.userLat,
      user_lng: opts?.userLng,
      price_sort: opts?.priceSort ?? 'smart',
      max_distance_km: opts?.maxDistanceKm ?? undefined,
      min_rating: opts?.minRating ?? undefined,
      verified_only: opts?.verifiedOnly ?? false,
      available_today: opts?.availableToday ?? false,
      lang: opts?.lang ?? 'en',
    });
    return data;
  } catch (e) {
    throw new Error(parseErr(e));
  }
}

/** @deprecated use discover + createBookingFromDiscover */
export async function orchestrate(
  text: string,
  userId: string,
  name?: string,
  phone?: string,
  opts?: DiscoverOpts
): Promise<DiscoverResult> {
  return discover(text, userId, name, phone, opts);
}

export async function createBookingFromDiscover(
  sessionId: string,
  providerId: string,
  userId: string,
  name?: string,
  phone?: string
): Promise<OrchestrateResult> {
  const { data } = await api.post<OrchestrateResult>('/api/bookings/create', {
    session_id: sessionId,
    provider_id: providerId,
    user_id: userId,
    customer_name: name,
    customer_phone: phone,
  });
  return data as OrchestrateResult;
}

export async function saveProvider(userId: string, providerId: string) {
  const { data } = await api.post(`/api/users/${userId}/saved/${providerId}`);
  return data;
}

export async function startBooking(bookingId: string) {
  const { data } = await api.post(`/api/bookings/${bookingId}/start`);
  return data;
}

export async function getContactedWorkers(userId: string) {
  const { data } = await api.get<{ contacted: ContactedWorker[] }>(
    `/api/users/${userId}/contacted`
  );
  return data.contacted;
}

export type ServiceCategory = {
  id: string;
  label: string;
  emoji: string;
  provider_count: number;
  price_min_pkr: number;
  price_max_pkr: number;
  search_template_en: string;
  search_template_ur: string;
};

export async function getServiceCategories() {
  const { data } = await api.get<{ categories: ServiceCategory[]; total_providers: number }>(
    '/api/services/categories'
  );
  return data;
}

export async function getSuggestions(hour: number) {
  const { data } = await api.get<{ suggestions: Array<{ service_type: string; label: string }> }>(
    '/api/suggestions',
    { params: { hour } }
  );
  return data.suggestions;
}

export async function getBookings(userId: string, tab?: string) {
  const { data } = await api.get<{ bookings: Array<Record<string, unknown>> }>(
    `/api/bookings/user/${userId}`,
    { params: tab ? { tab } : {} }
  );
  return data.bookings;
}

export async function cancelBooking(id: string, userId: string) {
  const { data } = await api.patch(`/api/bookings/${id}/cancel`, null, { params: { user_id: userId } });
  return data;
}

export async function confirmBooking(id: string) {
  const { data } = await api.post(`/api/bookings/${id}/confirm`);
  return data;
}

export type PaymentMethod = 'card' | 'jazzcash' | 'easypaisa' | 'cash';

export async function confirmPayment(body: {
  payment_id: string;
  booking_id: string;
  method: PaymentMethod;
  user_id?: string;
  customer_phone?: string;
  stripe_payment_intent_id?: string;
}) {
  try {
    const { data } = await api.post<{
      booking_id: string;
      status: string;
      notifications?: Array<{ channel: string; status: string }>;
      rate_booking?: boolean;
    }>('/api/payments/confirm', {
      ...body,
      notify_channels: ['sms', 'whatsapp'],
    });
    return data;
  } catch (e) {
    throw new Error(parseErr(e));
  }
}

export async function unsaveProvider(userId: string, providerId: string) {
  const { data } = await api.delete(`/api/users/${userId}/saved/${providerId}`);
  return data;
}

export async function providerRespondToJob(
  bookingId: string,
  providerId: string,
  action: 'accept' | 'decline'
) {
  const { data } = await api.post(`/api/provider/jobs/${bookingId}/respond`, {
    provider_id: providerId,
    action,
  });
  return data;
}

export async function postReview(body: {
  booking_id: string;
  user_id: string;
  provider_id: string;
  rating: number;
  comment?: string;
  tags?: string[];
  location_area?: string;
}) {
  const { data } = await api.post('/api/reviews', body);
  return data;
}

export async function getProvider(id: string, userId?: string) {
  const { data } = await api.get(`/api/providers/${id}`, { params: userId ? { user_id: userId } : {} });
  return data;
}

export async function sendOtp(phone: string) {
  const { data } = await api.post<{ phone: string; message: string; demo_otp?: string; twilio?: boolean }>(
    '/api/auth/send-otp',
    { phone }
  );
  return data;
}

export async function verifyAuth(phone: string, otp: string, name?: string) {
  const { data } = await api.post<{ user_id: string; token: string; name: string }>('/api/auth/verify', {
    phone,
    otp,
    name,
  });
  return data;
}

export async function transcribeSpeech(audioBase64: string, mimeType: string) {
  const { data } = await api.post<{ text: string; mode: string; provider: string }>(
    '/api/speech/transcribe',
    { audio_base64: audioBase64, mime_type: mimeType }
  );
  return data;
}

export async function getSessionTrace(sessionId: string) {
  const { data } = await api.get<{
    session_id: string;
    trace: OrchestrateResult['trace'];
    summary?: OrchestrateResult['trace_summary'];
  }>(`/api/trace/${sessionId}`);
  return data;
}

export async function getUserReviews(userId: string) {
  const { data } = await api.get<{
    reviews: Array<{
      rating: number;
      comment?: string;
      provider_name?: string;
      created_at?: string;
    }>;
  }>(`/api/reviews/user/${userId}`);
  return data.reviews;
}

export async function getGoogleStatus() {
  const { data } = await api.get<{ gemini_configured: boolean; maps_configured: boolean }>(
    '/api/google/status'
  );
  return data;
}
