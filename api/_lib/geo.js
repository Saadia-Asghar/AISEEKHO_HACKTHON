const AREA_COORDS = {
  'G-13': [33.6842, 72.9784],
  'G-12': [33.678, 72.972],
  'G-11': [33.679, 72.97],
  'G-10': [33.675, 72.965],
  'G-9': [33.6862, 72.9804],
  'F-7': [33.7215, 73.0432],
  'F-8': [33.715, 73.038],
  'I-8': [33.6598, 73.0412],
  'I-9': [33.652, 73.035],
  DHA: [33.52, 73.15],
  ISLAMABAD: [33.6844, 73.0479],
  'BLUE AREA': [33.71, 73.06],
};

function haversineKm(lat1, lng1, lat2, lng2) {
  const r = 6371;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dlat = ((lat2 - lat1) * Math.PI) / 180;
  const dlng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dlat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dlng / 2) ** 2;
  return Math.round(2 * r * Math.asin(Math.sqrt(a)) * 10) / 10;
}

function resolveCoords(location, userLat, userLng) {
  if (userLat != null && userLng != null) {
    return { lat: Number(userLat), lng: Number(userLng), source: 'gps' };
  }
  const key = String(location || 'G-13')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
  const hit = AREA_COORDS[key] || AREA_COORDS['G-13'];
  return { lat: hit[0], lng: hit[1], source: 'sector' };
}

module.exports = { haversineKm, resolveCoords };
