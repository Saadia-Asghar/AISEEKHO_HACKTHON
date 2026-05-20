import { getApiBaseUrl } from './apiConfig';

/** True when GET /health returns 2xx with JSON. */
export async function isApiHealthy(timeoutMs = 12_000): Promise<boolean> {
  const base = getApiBaseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/health`, { method: 'GET', signal: controller.signal });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return data != null && typeof data === 'object';
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
