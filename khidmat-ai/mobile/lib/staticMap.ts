import axios from 'axios';
import type { MapMarker } from '../api/client';

import { getApiBaseUrl } from './apiConfig';

const MAP_W = 640;
const MAP_H = 400;

function bounds(markers: MapMarker[], userLat?: number, userLng?: number) {
  const lats = markers.map((m) => m.lat);
  const lngs = markers.map((m) => m.lng);
  if (userLat != null) lats.push(userLat);
  if (userLng != null) lngs.push(userLng);
  const pad = 0.008;
  return {
    minLat: Math.min(...lats) - pad,
    maxLat: Math.max(...lats) + pad,
    minLng: Math.min(...lngs) - pad,
    maxLng: Math.max(...lngs) + pad,
    centerLat: (Math.min(...lats) + Math.max(...lats)) / 2,
    centerLng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };
}

/** Google Static Maps — set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in mobile/.env */
export function googleStaticMapUrl(
  markers: MapMarker[],
  userLat?: number,
  userLng?: number
): string | null {
  const key =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  if (!key || !markers.length) return null;

  const b = bounds(markers, userLat, userLng);
  const parts: string[] = [
    `center=${b.centerLat},${b.centerLng}`,
    'zoom=14',
    `size=${MAP_W}x${MAP_H}`,
    'scale=2',
    'maptype=roadmap',
  ];

  if (userLat != null && userLng != null) {
    parts.push(`markers=color:green%7Clabel:Y%7C${userLat},${userLng}`);
  }
  markers.forEach((m, i) => {
    const color = m.is_recommended ? 'orange' : 'violet';
    const label = String((i % 9) + 1);
    parts.push(`markers=color:${color}%7Clabel:${label}%7C${m.lat},${m.lng}`);
  });

  return `https://maps.googleapis.com/maps/api/staticmap?${parts.join('&')}&key=${key}`;
}

/** Uses GOOGLE_MAPS_API_KEY from backend/.env (no mobile key required). */
export async function fetchGoogleStaticMapFromApi(
  markers: MapMarker[],
  userLat?: number,
  userLng?: number
): Promise<string | null> {
  if (!markers.length) return null;
  try {
    const { data } = await axios.post<{ url: string }>(
      `${getApiBaseUrl()}/api/maps/static`,
      {
        markers,
        user_lat: userLat,
        user_lng: userLng,
      },
      { timeout: 12000 }
    );
    return data.url || null;
  } catch {
    return null;
  }
}

/** Client env key first, then backend API. */
export async function resolveGoogleMapUrl(
  markers: MapMarker[],
  userLat?: number,
  userLng?: number
): Promise<string | null> {
  const local = googleStaticMapUrl(markers, userLat, userLng);
  if (local) return local;
  return fetchGoogleStaticMapFromApi(markers, userLat, userLng);
}

/** Free embed — no API key (web iframe). */
export function openStreetMapEmbedUrl(
  markers: MapMarker[],
  userLat?: number,
  userLng?: number
): string | null {
  if (!markers.length) return null;
  const b = bounds(markers, userLat, userLng);
  const lat = userLat ?? b.centerLat;
  const lng = userLng ?? b.centerLng;
  return (
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${b.minLng}%2C${b.minLat}%2C${b.maxLng}%2C${b.maxLat}` +
    `&layer=mapnik&marker=${lat}%2C${lng}`
  );
}
