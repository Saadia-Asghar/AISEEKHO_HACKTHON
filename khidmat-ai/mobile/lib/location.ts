import { Platform } from 'react-native';

/** Islamabad G-13 default when GPS unavailable */
export const DEFAULT_COORDS = { lat: 33.6844, lng: 72.9772 };

export async function getUserCoords(): Promise<{ lat: number; lng: number; source: string }> {
  if (Platform.OS === 'web') {
    return { ...DEFAULT_COORDS, source: 'default' };
  }
  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { ...DEFAULT_COORDS, source: 'default' };
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      source: 'gps',
    };
  } catch {
    return { ...DEFAULT_COORDS, source: 'default' };
  }
}
