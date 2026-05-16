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
  name: string;
  distance_km: number;
  rating: number;
  score?: number;
  rank_reason?: string;
  score_breakdown?: Record<string, number>;
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
  recommended: ProviderRank & { phone: string };
  booking: {
    booking_id: string;
    slot: string;
    status: string;
    confirmation_message: string;
    receipt: string;
  };
  follow_up: {
    reminder_scheduled: boolean;
    reminder_time: string;
    completion_check_time: string;
    status_update: string;
    booking_status: string;
  };
  trace: TraceEntry[];
  trace_summary?: { human_readable: string; outcome: string };
};

export async function orchestrate(message: string, sessionId?: string): Promise<OrchestrationResult> {
  const res = await fetch(`${API_BASE}/api/orchestrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || res.statusText);
  }
  return res.json();
}

export async function fetchExamples(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/examples`);
  const data = await res.json();
  return data.samples || [];
}
