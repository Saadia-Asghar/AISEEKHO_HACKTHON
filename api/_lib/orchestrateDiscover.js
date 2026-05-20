const { randomUUID } = require('crypto');
const providers = require('../data/providers.json');
const { parseIntent } = require('./nlu');
const { haversineKm, resolveCoords } = require('./geo');

const DEFAULT_RADIUS = 5;
const WIDEN_RADIUS = 10;

const TYPICAL_JOBS = {
  ac_technician: [
    { title: 'AC gas refill', title_ur: 'AC گیس ریفل', price_min_pkr: 3500, price_max_pkr: 5500 },
    { title: 'General service', title_ur: 'جنرل سروس', price_min_pkr: 2200, price_max_pkr: 4000 },
  ],
  plumber: [
    { title: 'Tap / leak fix', title_ur: 'ٹنکی / لیکج', price_min_pkr: 1500, price_max_pkr: 3500 },
  ],
  general: [{ title: 'Standard visit', title_ur: 'عام وزٹ', price_min_pkr: 1500, price_max_pkr: 3000 }],
};

const PRICE_RANGES = {
  ac_technician: [2200, 5500],
  plumber: [1500, 4500],
  electrician: [1200, 5000],
  cleaner: [1200, 4500],
  painter: [1500, 7000],
  tutor: [1200, 15000],
  general: [1500, 3500],
};

function trace(agent, action, reasoning) {
  return {
    agent,
    phase: agent.includes('Ranking') ? 'decision' : 'planning',
    action,
    reasoning,
    timestamp: new Date().toISOString(),
  };
}

function toSummary(p, score, breakdown) {
  return {
    id: p.id,
    name: p.name,
    rating: p.rating,
    distance_km: p.distance_km,
    phone: p.phone,
    area: p.area,
    category: p.category,
    price_min_pkr: p.price_min_pkr,
    price_max_pkr: p.price_max_pkr,
    verified: p.verified,
    score,
    score_breakdown: breakdown,
    lat: p.lat,
    lng: p.lng,
    effective_rating: p.rating,
  };
}

function filterProviders(intent, userLat, userLng, radiusKm) {
  const matches = [];
  for (const p of providers) {
    const cats = p.categories || [p.category];
    if (intent.service_type !== 'general' && !cats.includes(intent.service_type)) continue;
    const dist = haversineKm(userLat, userLng, p.lat, p.lng);
    if (dist > radiusKm) continue;
    const slots = p.available_slots || [];
    matches.push({
      ...p,
      distance_km: dist,
      available_slots: slots,
      available_now: slots.length > 0,
    });
  }
  matches.sort((a, b) => a.distance_km - b.distance_km);
  return matches;
}

function scoreProvider(p, intent) {
  const distanceComponent = Math.max(0, 10 - 2 * Math.min(p.distance_km, 5));
  const ratingComponent = (p.rating / 5) * 10;
  const availabilityComponent = p.available_slots?.length ? 10 : 0;
  const breakdown = {
    distance_40pct: Math.round(distanceComponent * 0.4 * 100) / 100,
    rating_35pct: Math.round(ratingComponent * 0.35 * 100) / 100,
    availability_25pct: Math.round(availabilityComponent * 0.25 * 100) / 100,
  };
  const total = Math.round((breakdown.distance_40pct + breakdown.rating_35pct + breakdown.availability_25pct) * 100) / 100;
  return { total, breakdown };
}

function buildPricing(serviceType, lang) {
  const [pmin, pmax] = PRICE_RANGES[serviceType] || PRICE_RANGES.general;
  const jobs = TYPICAL_JOBS[serviceType] || TYPICAL_JOBS.general;
  const ur = lang === 'ur';
  return {
    estimate_min_pkr: pmin,
    estimate_max_pkr: pmax,
    visit_fee_note: ur
      ? 'وزٹ / چیک اپ فیس الگ ہو سکتی ہے۔'
      : 'Visit / diagnosis fee may apply. Parts are extra.',
    final_price_note: ur
      ? 'مرمت کے کام کی حتمی قیمت وزٹ کے بعد طے ہوگی۔'
      : 'Final price confirmed after visit for repair jobs.',
    service_label: serviceType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    typical_jobs: jobs,
  };
}

/** Full discover pipeline on Vercel (no Render). */
function runDiscover(body) {
  const message = String(body.message || '').trim();
  if (!message) throw new Error('message is required');

  const intent = parseIntent(message);
  const loc = resolveCoords(intent.location, body.user_lat, body.user_lng);
  let radius = DEFAULT_RADIUS;
  let candidates = filterProviders(intent, loc.lat, loc.lng, radius);
  if (candidates.length < 3) {
    radius = WIDEN_RADIUS;
    candidates = filterProviders(intent, loc.lat, loc.lng, radius);
  }
  if (!candidates.length) {
    throw new Error(
      `No providers found for '${intent.service_label}' near ${intent.location}. Try another sector.`,
    );
  }

  const scored = candidates.map((p) => {
    const { total, breakdown } = scoreProvider(p, intent);
    return { p, total, breakdown };
  });
  scored.sort((a, b) => b.total - a.total);

  const topThree = scored.slice(0, 3).map(({ p, total, breakdown }) => toSummary(p, total, breakdown));
  const recommended = topThree[0];
  const alternatives = scored.slice(0, 5).map(({ p, total, breakdown }) => ({
    name: p.name,
    provider_id: p.id,
    score: total,
    distance_score: breakdown.distance_40pct,
    rating_score: breakdown.rating_35pct,
    availability_score: breakdown.availability_25pct,
    total_score: total,
  }));

  const traces = [
    trace(
      'IntentUnderstandingAgent',
      'parse_natural_language',
      `Parsed ${intent.language}: ${intent.service_label} in ${intent.location}, ${intent.time_expression}.`,
    ),
    trace(
      'ProviderDiscoveryAgent',
      'discover_providers',
      `Found ${candidates.length} providers within ${radius} km (mock dataset).`,
    ),
    trace(
      'RankingAgent',
      'rank_providers',
      `Top pick: ${recommended.name} (${recommended.distance_km} km, score ${recommended.score}).`,
    ),
    trace('TraceAgent', 'compile_trace', 'Agent trace compiled for Antigravity demo.'),
  ];

  const sessionId = body.session_id || randomUUID();
  const mapMarkers = candidates.slice(0, 12).map((p) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    distance_km: p.distance_km,
    rating: p.rating,
    area: p.area,
    category: p.category,
    price_min_pkr: p.price_min_pkr,
    price_max_pkr: p.price_max_pkr,
    is_recommended: p.id === recommended.id,
  }));

  return {
    session_id: sessionId,
    intent,
    recommended,
    top_three: topThree,
    top_rated: [...topThree].sort((a, b) => b.rating - a.rating),
    candidates: scored.map(({ p, total, breakdown }) => toSummary(p, total, breakdown)),
    map_markers: mapMarkers,
    user_location: loc,
    price_sort: body.price_sort || 'smart',
    alternatives,
    pricing: buildPricing(intent.service_type, body.lang || 'en'),
    preview: true,
    trace: traces,
    trace_summary: { outcome: `Recommended ${recommended.name} for ${intent.service_label}` },
  };
}

module.exports = { runDiscover };
