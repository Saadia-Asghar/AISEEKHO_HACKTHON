const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export type TraceEntry = {
  agent: string;
  phase: string;
  action: string;
  reasoning: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

export type ProviderRank = {
  id: string;
  name: string;
  distance_km: number;
  rating: number;
  effective_rating?: number;
  score?: number;
  rank_reason?: string;
  score_breakdown?: Record<string, number>;
  is_saved?: boolean;
  your_rating?: number | null;
  phone?: string;
  area?: string;
  category?: string;
};

export type PersonalizationSummary = {
  saved_boost_applied: boolean;
  repeat_provider_boost: boolean;
  user_rating_influence: string | null;
};

export type OrchestrationResult = {
  session_id: string;
  intent: {
    raw_message: string;
    language: string;
    service_label: string;
    location: string;
    time_expression: string;
    urgency?: boolean;
  };
  top_three: ProviderRank[];
  recommended: ProviderRank & { phone: string; id: string };
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
  payment: {
    payment_id: string;
    booking_id: string;
    amount_pkr: number;
    method: string;
    status: string;
    simulated?: boolean;
    instructions?: string;
    stripe_client_secret?: string | null;
    stripe_payment_intent_id?: string | null;
  };
  user_location?: { lat: number; lng: number; source: string };
  notifications?: Array<{ channel: string; to: string; status: string; preview?: string }>;
  follow_up: {
    reminder_scheduled: boolean;
    reminder_time: string;
    completion_check_time: string;
    status_update: string;
    booking_status: string;
  };
  trace: TraceEntry[];
  trace_summary?: { human_readable: string; outcome: string };
  personalization?: PersonalizationSummary | null;
  rate_booking?: boolean;
};

export type SavedProvider = {
  id: string;
  name: string;
  category: string;
  area: string;
  rating: number;
  reviews: number;
  phone: string;
  saved_at: string;
  your_rating?: number | null;
};

export type BookingHistoryItem = {
  booking_id: string;
  provider_id: string;
  provider_name: string;
  service_type: string;
  location: string;
  slot: string;
  status: string;
  created_at: string;
  rated: boolean;
  user_stars?: number | null;
};

async function parseError(res: Response): Promise<string> {
  const err = await res.json().catch(() => ({}));
  return (err as { detail?: string }).detail || res.statusText;
}

export async function syncClerkUser(
  clerkUserId: string,
  displayName: string,
  phone?: string
): Promise<{ user_id: string; display_name: string; clerk_id: string; phone?: string }> {
  const res = await fetch(`${API_BASE}/api/auth/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clerk_user_id: clerkUserId,
      display_name: displayName,
      phone,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function confirmPayment(params: {
  paymentId: string;
  bookingId: string;
  method: string;
  userId?: string;
  customerPhone?: string;
  stripePaymentIntentId?: string;
}) {
  const res = await fetch(`${API_BASE}/api/payments/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payment_id: params.paymentId,
      booking_id: params.bookingId,
      method: params.method,
      user_id: params.userId,
      customer_phone: params.customerPhone,
      stripe_payment_intent_id: params.stripePaymentIntentId,
      notify_channels: ['sms', 'whatsapp'],
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createUser(displayName: string): Promise<{ user_id: string; display_name: string }> {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ display_name: displayName }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getUserProfile(userId: string) {
  const res = await fetch(`${API_BASE}/api/users/${userId}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function orchestrate(
  message: string,
  userId?: string,
  customerName?: string,
  sessionId?: string,
  coords?: { lat: number; lng: number } | null,
  customerPhone?: string | null
): Promise<OrchestrationResult> {
  const res = await fetch(`${API_BASE}/api/orchestrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      user_id: userId,
      customer_name: customerName,
      session_id: sessionId,
      user_lat: coords?.lat,
      user_lng: coords?.lng,
      customer_phone: customerPhone,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function submitRating(
  userId: string,
  providerId: string,
  bookingId: string,
  stars: number,
  comment?: string
) {
  const res = await fetch(`${API_BASE}/api/users/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      provider_id: providerId,
      booking_id: bookingId,
      stars,
      comment,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function saveProvider(userId: string, providerId: string) {
  const res = await fetch(`${API_BASE}/api/users/${userId}/saved/${providerId}`, { method: 'POST' });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function unsaveProvider(userId: string, providerId: string) {
  const res = await fetch(`${API_BASE}/api/users/${userId}/saved/${providerId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchSaved(userId: string): Promise<SavedProvider[]> {
  const res = await fetch(`${API_BASE}/api/users/${userId}/saved`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.saved || [];
}

export async function fetchBookings(userId: string): Promise<BookingHistoryItem[]> {
  const res = await fetch(`${API_BASE}/api/users/${userId}/bookings`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.bookings || [];
}

export async function fetchExamples(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/examples`);
  const data = await res.json();
  return data.samples || [];
}
