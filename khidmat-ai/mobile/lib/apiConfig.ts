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

/** Public API base URL (no trailing slash). */
export function getApiBaseUrl(): string {
  let url = readEnvApiUrl();
  if (!url && isProductionWeb()) {
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
    return `Cannot reach API at ${base}. Deploy the backend on Render (see docs/SUBMISSION.md) or use Skip — Continue as Guest for offline demo.`;
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
