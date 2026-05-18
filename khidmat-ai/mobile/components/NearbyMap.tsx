import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import type { MapMarker } from '../api/client';

const MAP_W = 320;
const MAP_H = 200;

function project(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  span: number
): { x: number; y: number } {
  const x = ((lng - centerLng) / span) * (MAP_W * 0.42) + MAP_W / 2;
  const y = ((centerLat - lat) / span) * (MAP_H * 0.42) + MAP_H / 2;
  return {
    x: Math.max(24, Math.min(MAP_W - 24, x)),
    y: Math.max(24, Math.min(MAP_H - 24, y)),
  };
}

export default function NearbyMap({
  markers,
  userLat,
  userLng,
  onMarkerPress,
}: {
  markers: MapMarker[];
  userLat?: number;
  userLng?: number;
  onMarkerPress?: (id: string) => void;
}) {
  const layout = useMemo(() => {
    if (!markers.length) return null;
    const centerLat = userLat ?? markers[0].lat;
    const centerLng = userLng ?? markers[0].lng;
    const lats = markers.map((m) => m.lat);
    const lngs = markers.map((m) => m.lng);
    const span = Math.max(
      0.012,
      Math.max(...lats) - Math.min(...lats),
      Math.max(...lngs) - Math.min(...lngs)
    ) * 1.4;
    return {
      centerLat,
      centerLng,
      span,
      pins: markers.map((m) => ({
        ...m,
        ...project(m.lat, m.lng, centerLat, centerLng, span),
      })),
      user: project(centerLat, centerLng, centerLat, centerLng, span),
    };
  }, [markers, userLat, userLng]);

  if (!layout) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No map data for this search</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>📍 Nearby on map</Text>
      <View style={[styles.map, { width: '100%', height: MAP_H }]}>
        <View style={styles.gridH} />
        <View style={styles.gridV} />
        <View style={[styles.userPin, { left: layout.user.x - 10, top: layout.user.y - 10 }]}>
          <Text style={styles.userDot}>●</Text>
          <Text style={styles.userLabel}>You</Text>
        </View>
        {layout.pins.map((p) => (
          <Pressable
            key={p.id}
            style={[
              styles.pin,
              p.is_recommended && styles.pinRec,
              { left: p.x - 14, top: p.y - 14 },
            ]}
            onPress={() => onMarkerPress?.(p.id)}
          >
            <Text style={styles.pinEmoji}>{p.is_recommended ? '⭐' : p.contacted_before ? '👷' : '📍'}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendItem}>● You</Text>
        <Text style={styles.legendItem}>⭐ Top match</Text>
        <Text style={styles.legendItem}>👷 Contacted before</Text>
      </View>
      <View style={styles.list}>
        {markers.slice(0, 4).map((m) => (
          <Pressable key={m.id} style={styles.listRow} onPress={() => onMarkerPress?.(m.id)}>
            <Text style={styles.listName} numberOfLines={1}>
              {m.name}
            </Text>
            <Text style={styles.listMeta}>
              {m.distance_km.toFixed(1)} km · ★ {m.rating.toFixed(1)}
              {m.price_min_pkr ? ` · from ${m.price_min_pkr.toLocaleString()} PKR` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    fontFamily: fonts.body,
  },
  map: {
    backgroundColor: 'rgba(46,196,169,0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(46,196,169,0.25)',
    overflow: 'hidden',
    position: 'relative',
  },
  gridH: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gridV: {
    position: 'absolute',
    top: '20%',
    bottom: '20%',
    left: '50%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  userPin: { position: 'absolute', alignItems: 'center', zIndex: 3 },
  userDot: { color: colors.jade, fontSize: 22 },
  userLabel: { fontSize: 9, color: colors.jade, fontWeight: '700', fontFamily: fonts.body },
  pin: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pinRec: { borderColor: colors.amber, backgroundColor: colors.amberSoft },
  pinEmoji: { fontSize: 14 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  legendItem: { fontSize: 10, color: colors.text3, fontFamily: fonts.body },
  list: { marginTop: 10, gap: 6 },
  listRow: {
    padding: 10,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listName: { fontSize: 13, fontWeight: '600', color: colors.text, fontFamily: fonts.body },
  listMeta: { fontSize: 11, color: colors.text2, marginTop: 2, fontFamily: fonts.body },
  empty: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
  },
  emptyText: { color: colors.text3, fontSize: 12, textAlign: 'center', fontFamily: fonts.body },
});
