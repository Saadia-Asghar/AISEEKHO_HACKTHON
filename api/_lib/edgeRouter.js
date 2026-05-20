const { runDiscover } = require('./orchestrateDiscover');
const { sendOtp, verifyOtp } = require('./edgeAuth');
const providers = require('../data/providers.json');

function upstreamBase() {
  const raw =
    process.env.KHIDMAT_API_UPSTREAM ||
    process.env.EXPO_PUBLIC_API_URL ||
    'https://khidmatai-api.onrender.com';
  return String(raw).replace(/\/$/, '');
}

function useRenderProxy() {
  return process.env.KHIDMAT_USE_RENDER === '1' || process.env.KHIDMAT_USE_RENDER === 'true';
}

async function tryUpstream(pathPart, req) {
  const target = new URL(`${upstreamBase()}/api/${pathPart}`);
  const headers = { 'Content-Type': 'application/json' };
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;

  const init = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body != null) {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    const upstream = await fetch(target.toString(), init);
    const body = await upstream.text();
    return {
      status: upstream.status,
      body,
      contentType: upstream.headers.get('content-type') || 'application/json',
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

function sendUpstream(res, upstream) {
  res.status(upstream.status);
  res.setHeader('Content-Type', upstream.contentType);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(upstream.body);
}

function sendJson(res, status, data) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(data);
}

function getHourFromReq(req) {
  const raw = req?.query?.hour;
  const val = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(val);
  if (Number.isFinite(n) && n >= 0 && n <= 23) return n;
  return new Date().getHours();
}

function buildSuggestions(hour) {
  const morning = [
    { service_type: 'cleaner', label: 'Cleaner' },
    { service_type: 'plumber', label: 'Plumber' },
    { service_type: 'electrician', label: 'Electrician' },
  ];
  const evening = [
    { service_type: 'ac_technician', label: 'AC Technician' },
    { service_type: 'tutor', label: 'Home Tutor' },
    { service_type: 'beautician', label: 'Beautician' },
  ];
  return hour < 14 ? morning : evening;
}

function toProviderSummary(p, lat, lng) {
  const d =
    lat == null || lng == null
      ? null
      : Math.round(
          10 *
            (Math.acos(
              Math.sin((lat * Math.PI) / 180) * Math.sin((p.lat * Math.PI) / 180) +
                Math.cos((lat * Math.PI) / 180) *
                  Math.cos((p.lat * Math.PI) / 180) *
                  Math.cos(((p.lng - lng) * Math.PI) / 180),
            ) * 6371),
        ) / 10;
  return {
    id: p.id,
    name: p.name,
    rating: p.rating,
    distance_km: d ?? 0,
    phone: p.phone,
    area: p.area,
    category: p.category,
    price_min_pkr: p.price_min_pkr,
    price_max_pkr: p.price_max_pkr,
    verified: !!p.verified,
    lat: p.lat,
    lng: p.lng,
  };
}

/** Vercel edge handlers (no Render). Returns true if handled. */
async function handleEdgeApi(pathPart, req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).end();
    return true;
  }

  if (pathPart === 'discover' && req.method === 'POST') {
    try {
      const data = runDiscover(req.body || {});
      sendJson(res, 200, data);
    } catch (e) {
      sendJson(res, 404, { detail: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  if (pathPart === 'suggestions' && req.method === 'GET') {
    const hour = getHourFromReq(req);
    sendJson(res, 200, { suggestions: buildSuggestions(hour) });
    return true;
  }

  if (pathPart === 'google/status' && req.method === 'GET') {
    sendJson(res, 200, {
      gemini_configured: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      maps_configured: !!process.env.GOOGLE_MAPS_API_KEY,
    });
    return true;
  }

  if (/^users\/[^/]+\/contacted$/.test(pathPart) && req.method === 'GET') {
    sendJson(res, 200, { contacted: [] });
    return true;
  }

  if (pathPart === 'services/categories' && req.method === 'GET') {
    const map = new Map();
    for (const p of providers) {
      const key = p.category;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          emoji: '🔧',
          provider_count: 0,
          price_min_pkr: p.price_min_pkr ?? 1000,
          price_max_pkr: p.price_max_pkr ?? 5000,
          search_template_en: `Need ${key.replace(/_/g, ' ')} in {area}`,
          search_template_ur: `{area} mein ${key.replace(/_/g, ' ')} chahiye`,
        });
      }
      const row = map.get(key);
      row.provider_count += 1;
      row.price_min_pkr = Math.min(row.price_min_pkr, p.price_min_pkr ?? row.price_min_pkr);
      row.price_max_pkr = Math.max(row.price_max_pkr, p.price_max_pkr ?? row.price_max_pkr);
    }
    const categories = Array.from(map.values());
    sendJson(res, 200, { categories, total_providers: providers.length });
    return true;
  }

  if (pathPart === 'providers/list' && req.method === 'GET') {
    const category = String(req.query?.category || '').trim();
    const area = String(req.query?.area || '').trim().toUpperCase();
    const limitRaw = Number(req.query?.limit);
    const lat = req.query?.lat != null ? Number(req.query.lat) : null;
    const lng = req.query?.lng != null ? Number(req.query.lng) : null;
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, limitRaw)) : 50;
    const filtered = providers
      .filter((p) => (!category ? true : (p.categories || [p.category]).includes(category)))
      .filter((p) => (!area ? true : String(p.area || '').toUpperCase() === area))
      .slice(0, limit)
      .map((p) => toProviderSummary(p, lat, lng));
    sendJson(res, 200, {
      category: category || 'all',
      area: area || 'ALL',
      count: filtered.length,
      providers: filtered,
    });
    return true;
  }

  if (pathPart === 'auth/send-otp' && req.method === 'POST') {
    sendJson(res, 200, sendOtp(req.body?.phone || ''));
    return true;
  }

  if (pathPart === 'auth/verify' && req.method === 'POST') {
    try {
      const { phone, otp, name } = req.body || {};
      sendJson(res, 200, verifyOtp(phone, otp, name));
    } catch (e) {
      sendJson(res, 400, { detail: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  return false;
}

async function handleApi(pathPart, req, res) {
  const normalizedPath = String(pathPart || '').replace(/^\/+|\/+$/g, '');

  // Some clients probe /api or /api/; keep this healthy.
  if (!normalizedPath) {
    return sendJson(res, 200, {
      ok: true,
      mode: useRenderProxy() ? 'render-proxy-or-edge' : 'edge',
      routes: ['discover', 'auth/send-otp', 'auth/verify', 'health'],
    });
  }

  if (useRenderProxy()) {
    const upstream = await tryUpstream(normalizedPath, req);
    if (upstream && !upstream.error) {
      sendUpstream(res, upstream);
      return;
    }
    const edgeHandled = await handleEdgeApi(normalizedPath, req, res);
    if (edgeHandled) return;

    if (upstream?.error) {
      return sendJson(res, 502, {
        detail: `Cannot reach Render at ${upstreamBase()}: ${upstream.error}. Fix KHIDMAT_API_UPSTREAM or unset KHIDMAT_USE_RENDER.`,
      });
    }
    return sendJson(res, 502, {
      detail: `Render returned an error for /api/${normalizedPath}. Check ${upstreamBase()}/health — or unset KHIDMAT_USE_RENDER to use Vercel edge AI only.`,
      upstream_status: upstream?.status,
    });
  }

  if (await handleEdgeApi(normalizedPath, req, res)) return;

  return sendJson(res, 404, {
    detail: `Unknown route /api/${normalizedPath}. For full backend set KHIDMAT_USE_RENDER=1 and a live KHIDMAT_API_UPSTREAM.`,
  });
}

module.exports = { handleApi, upstreamBase, useRenderProxy };
