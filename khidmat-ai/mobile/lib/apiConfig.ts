import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_LOCAL = 'http://127.0.0.1:8000';

function readEnvApiUrl(): string {
  const fromProcess = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromProcess) return fromProcess;
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const fromExtra = extra?.apiUrl?.trim();
  if (fromExtra) return fromExtra;
  return '';
}

/** Public API base URL (no trailing slash). */
export function getApiBaseUrl(): string {
  const url = readEnvApiUrl() || DEFAULT_LOCAL;
  return url.replace(/\/$/, '');
}

export function isLocalApiUrl(url?: string): boolean {
  const u = url ?? getApiBaseUrl();
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(u);
}

function isProductionWeb(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1';
}

/** Block calls to 127.0.0.1 from the live Vercel site (causes "Network Error"). */
export function assertApiReachable(): void {
  if (isProductionWeb() && isLocalApiUrl()) {
    throw new Error(
      'Backend URL is not configured for production. In Vercel → Settings → Environment Variables, set EXPO_PUBLIC_API_URL to your Render API (e.g. https://khidmatai-api.onrender.com), then Redeploy.',
    );
  }
}

export function formatApiNetworkError(err: unknown): string {
  if (isProductionWeb() && isLocalApiUrl()) {
    return 'Backend URL missing on Vercel. Set EXPO_PUBLIC_API_URL to your public API, then redeploy.';
  }
  const base = getApiBaseUrl();
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message?: string }).message || '');
    if (msg === 'Network Error' || msg.includes('ERR_NETWORK') || msg.includes('ECONNREFUSED')) {
      return `Cannot reach API (${base}). Start the backend locally or set EXPO_PUBLIC_API_URL on Vercel.`;
    }
  }
  return err instanceof Error ? err.message : 'Connection error — try again';
}
