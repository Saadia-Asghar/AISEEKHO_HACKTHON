import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_LOCAL = 'http://127.0.0.1:8000';
/** From render.yaml service name — override with EXPO_PUBLIC_API_URL on Vercel. */
export const DEFAULT_PRODUCTION_API = 'https://khidmatai-api.onrender.com';

function readEnvApiUrl(): string {
  const fromProcess = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromProcess) return fromProcess;
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const fromExtra = extra?.apiUrl?.trim();
  if (fromExtra) return fromExtra;
  return '';
}

export function isProductionWeb(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1';
}

/** Deployed web (Vercel, etc.): AI runs on same origin `/api/*` — never call Render from the browser. */
export function useHostedWebApiProxy(): boolean {
  return isProductionWeb();
}

/** Public API base URL (no trailing slash). */
export function getApiBaseUrl(): string {
  if (useHostedWebApiProxy() && typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }
  let url = readEnvApiUrl();
  // Native / local only — do not default production web to Render (that host is often down).
  if (!url && !isProductionWeb()) {
    url = DEFAULT_LOCAL;
  }
  if (!url && Platform.OS !== 'web') {
    url = DEFAULT_PRODUCTION_API;
  }
  if (!url) url = DEFAULT_LOCAL;
  return url.replace(/\/$/, '');
}

export function isLocalApiUrl(url?: string): boolean {
  const u = url ?? getApiBaseUrl();
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(u);
}

export function assertApiReachable(): void {
  if (isProductionWeb() && isLocalApiUrl()) {
    throw new Error(
      'Backend URL is not configured. Set EXPO_PUBLIC_API_URL on Vercel to your Render API URL, then Redeploy.',
    );
  }
}

export function isNetworkFailure(err: unknown): boolean {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message?: string }).message || '');
    if (msg === 'Network Error' || msg.includes('ERR_NETWORK') || msg.includes('ECONNREFUSED')) {
      return true;
    }
  }
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code?: string }).code || '');
    if (code === 'ERR_NETWORK' || code === 'ECONNABORTED') return true;
  }
  return false;
}

export function formatApiNetworkError(err: unknown): string {
  const base = getApiBaseUrl();
  if (isProductionWeb() && isLocalApiUrl()) {
    return 'Backend URL missing on Vercel. Set EXPO_PUBLIC_API_URL, then Redeploy.';
  }
  if (isNetworkFailure(err)) {
    if (useHostedWebApiProxy()) {
      return 'Cannot reach API. Redeploy Vercel (edge AI runs on the same domain). Try Skip guest + demo search.';
    }
    return `Cannot reach API at ${base}. Start local backend or open the Vercel deploy.`;
  }
  return err instanceof Error ? err.message : 'Connection error — try again';
}

/** Map Clerk/axios errors to readable auth screen text (never bare "Network Error"). */
export function humanizeAuthError(err: unknown): string {
  if (isNetworkFailure(err)) {
    return formatApiNetworkError(err);
  }
  if (err instanceof Error && err.message && err.message !== 'Network Error') {
    return err.message;
  }
  return formatApiNetworkError(err);
}
