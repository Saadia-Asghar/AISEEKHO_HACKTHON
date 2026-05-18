import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type UserCoords = { lat: number; lng: number } | null;

export function useLocation() {
  const [coords, setCoords] = useState<UserCoords>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied — using sector defaults');
        setCoords(null);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not get GPS');
      setCoords(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { coords, loading, error, refresh };
}
