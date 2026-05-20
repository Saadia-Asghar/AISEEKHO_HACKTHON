const { runDiscover } = require('./orchestrateDiscover');
const { sendOtp, verifyOtp } = require('./edgeAuth');
const providers = require('../data/providers.json');
const { randomUUID } = require('crypto');

const state = {
  discoverBySession: new Map(),
  bookingsById: new Map(),
  reviewsByProvider: new Map(),
  reviewsByUser: new Map(),
  savedByUser: new Map(),
  contactedByUser: new Map(),
};

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

function normalizeUserId(v) {
  return String(v || 'USR_GUEST').trim() || 'USR_GUEST';
}

function getSavedSet(userId) {
  const uid = normalizeUserId(userId);
  if (!state.savedByUser.has(uid)) state.savedByUser.set(uid, new Set());
  return state.savedByUser.get(uid);
}

function addContacted(userId, provider) {
  const uid = normalizeUserId(userId);
  if (!state.contactedByUser.has(uid)) state.contactedByUser.set(uid, new Map());
  const bag = state.contactedByUser.get(uid);
  const prev = bag.get(provider.id);
  bag.set(provider.id, {
    id: provider.id,
    name: provider.name,
    category: provider.category,
    area: provider.area,
    rating: provider.rating,
    phone: provider.phone,
    bookings_count: (prev?.bookings_count || 0) + 1,
    last_booked_at: new Date().toISOString(),
    price_min_pkr: provider.price_min_pkr,
    price_max_pkr: provider.price_max_pkr,
  });
}

function createPaymentId() {
  return `PAY-${Date.now().toString(36).toUpperCase()}`;
}

function createBookingId() {
  return `KHI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
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
      state.discoverBySession.set(data.session_id, data);
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

  if (pathPart === 'speech/transcribe' && req.method === 'POST') {
    sendJson(res, 200, { text: 'Voice transcribe unavailable on edge, used local transcript.', mode: 'fallback', provider: 'edge' });
    return true;
  }

  if (/^users\/[^/]+\/contacted$/.test(pathPart) && req.method === 'GET') {
    const userId = pathPart.split('/')[1];
    const rows = Array.from((state.contactedByUser.get(normalizeUserId(userId)) || new Map()).values());
    sendJson(res, 200, { contacted: rows });
    return true;
  }

  if (/^users\/[^/]+\/saved\/[^/]+$/.test(pathPart) && req.method === 'POST') {
    const [, userId, , providerId] = pathPart.split('/');
    getSavedSet(userId).add(providerId);
    sendJson(res, 200, { status: 'saved', user_id: userId, provider_id: providerId });
    return true;
  }

  if (/^users\/[^/]+\/saved\/[^/]+$/.test(pathPart) && req.method === 'DELETE') {
    const [, userId, , providerId] = pathPart.split('/');
    getSavedSet(userId).delete(providerId);
    sendJson(res, 200, { status: 'unsaved', user_id: userId, provider_id: providerId });
    return true;
  }

  if (/^users\/[^/]+$/.test(pathPart) && req.method === 'DELETE') {
    const [, userId] = pathPart.split('/');
    state.savedByUser.delete(normalizeUserId(userId));
    state.contactedByUser.delete(normalizeUserId(userId));
    sendJson(res, 200, { status: 'deleted', user_id: userId });
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

  if (/^providers\/[^/]+$/.test(pathPart) && req.method === 'GET') {
    const id = pathPart.split('/')[1];
    const userId = req.query?.user_id;
    const p = providers.find((x) => x.id === id);
    if (!p) return sendJson(res, 404, { detail: 'Provider not found' });
    const saved = getSavedSet(userId).has(id);
    const providerReviews = state.reviewsByProvider.get(id) || [];
    const avg =
      providerReviews.length > 0
        ? providerReviews.reduce((s, r) => s + Number(r.rating || 0), 0) / providerReviews.length
        : p.rating;
    return sendJson(res, 200, {
      ...toProviderSummary(p, null, null),
      bio: p.bio,
      is_saved: saved,
      average_rating: Number(avg.toFixed(1)),
      jobs_completed: 100 + providerReviews.length * 3,
      visit_fee_pkr: p.price_min_pkr || 500,
      hourly_rate_pkr: p.price_max_pkr || 1500,
      response_time_min: 20,
    });
  }

  if (/^providers\/[^/]+\/reviews$/.test(pathPart) && req.method === 'GET') {
    const id = pathPart.split('/')[1];
    const area = String(req.query?.location_area || '').toUpperCase();
    const rows = (state.reviewsByProvider.get(id) || []).map((r) => ({
      rating: r.rating,
      comment: r.comment,
      user_name: r.user_name,
      tags: r.tags || [],
      same_sector: area ? String(r.location_area || '').toUpperCase() === area : false,
    }));
    return sendJson(res, 200, { reviews: rows });
  }

  if (pathPart === 'reviews' && req.method === 'POST') {
    const body = req.body || {};
    const review = {
      id: `REV-${randomUUID().slice(0, 8)}`,
      booking_id: body.booking_id,
      user_id: normalizeUserId(body.user_id),
      provider_id: body.provider_id,
      rating: Number(body.rating || 5),
      comment: body.comment || '',
      tags: Array.isArray(body.tags) ? body.tags : [],
      location_area: body.location_area || '',
      user_name: 'Customer',
      created_at: new Date().toISOString(),
    };
    if (!state.reviewsByProvider.has(review.provider_id)) state.reviewsByProvider.set(review.provider_id, []);
    if (!state.reviewsByUser.has(review.user_id)) state.reviewsByUser.set(review.user_id, []);
    state.reviewsByProvider.get(review.provider_id).unshift(review);
    state.reviewsByUser.get(review.user_id).unshift(review);
    return sendJson(res, 200, { ok: true, review });
  }

  if (/^reviews\/user\/[^/]+$/.test(pathPart) && req.method === 'GET') {
    const userId = normalizeUserId(pathPart.split('/')[2]);
    const reviews = (state.reviewsByUser.get(userId) || []).map((r) => ({
      rating: r.rating,
      comment: r.comment,
      provider_name: providers.find((p) => p.id === r.provider_id)?.name || 'Provider',
      created_at: r.created_at,
    }));
    return sendJson(res, 200, { reviews });
  }

  if (pathPart === 'bookings/create' && req.method === 'POST') {
    const body = req.body || {};
    const sessionId = body.session_id;
    const providerId = body.provider_id;
    const discover = state.discoverBySession.get(sessionId);
    if (!discover) return sendJson(res, 404, { detail: 'Search session expired — search again.' });
    const provider =
      (discover.candidates || []).find((p) => p.id === providerId) ||
      (discover.top_three || []).find((p) => p.id === providerId) ||
      discover.recommended;
    if (!provider) return sendJson(res, 404, { detail: 'Provider not found in session.' });
    const bookingId = createBookingId();
    const paymentId = createPaymentId();
    const booking = {
      booking_id: bookingId,
      provider_name: provider.name,
      slot: '11:00',
      status: 'PENDING_PAYMENT',
      confirmation_message: `Booking created with ${provider.name}`,
      amount_pkr: provider.price_min_pkr || discover.pricing?.estimate_min_pkr || 2000,
      payment_status: 'pending',
    };
    const payment = {
      payment_id: paymentId,
      amount_pkr: booking.amount_pkr,
      status: 'pending',
      stripe_payment_intent_id: `pi_${Math.random().toString(36).slice(2, 10)}`,
    };
    const full = { ...discover, recommended: provider, booking, payment, preview: false };
    state.bookingsById.set(bookingId, {
      ...booking,
      id: bookingId,
      user_id: normalizeUserId(body.user_id),
      service_type: discover.intent?.service_label,
      location: discover.intent?.location,
      provider_id: provider.id,
      payment_id: paymentId,
      slot_datetime: `${new Date().toISOString().slice(0, 10)} ${booking.slot}`,
      session_id: sessionId,
    });
    return sendJson(res, 200, full);
  }

  if (pathPart === 'payments/confirm' && req.method === 'POST') {
    const body = req.body || {};
    const booking = state.bookingsById.get(body.booking_id);
    if (!booking) return sendJson(res, 404, { detail: 'Booking not found' });
    booking.status = 'CONFIRMED';
    booking.payment_status = 'paid';
    addContacted(booking.user_id, providers.find((p) => p.id === booking.provider_id) || {
      id: booking.provider_id,
      name: booking.provider_name,
      category: 'general',
      area: booking.location || 'G-13',
      rating: 4.5,
      phone: '+923000000000',
      price_min_pkr: booking.amount_pkr,
      price_max_pkr: booking.amount_pkr,
    });
    return sendJson(res, 200, {
      booking_id: booking.booking_id,
      status: 'paid',
      notifications: [
        { channel: 'sms', status: 'sent', preview: `Booking ${booking.booking_id} confirmed` },
        { channel: 'whatsapp', status: 'sent', preview: `Provider ${booking.provider_name} notified` },
      ],
      rate_booking: true,
    });
  }

  if (/^bookings\/user\/[^/]+$/.test(pathPart) && req.method === 'GET') {
    const userId = normalizeUserId(pathPart.split('/')[2]);
    const tab = String(req.query?.tab || 'upcoming').toLowerCase();
    const rows = Array.from(state.bookingsById.values()).filter((b) => b.user_id === userId);
    const filtered = rows.filter((b) => {
      if (tab === 'cancelled') return String(b.status).toUpperCase().includes('CANCEL');
      if (tab === 'past') return String(b.status).toUpperCase() === 'COMPLETED';
      return !String(b.status).toUpperCase().includes('CANCEL') && String(b.status).toUpperCase() !== 'COMPLETED';
    });
    return sendJson(res, 200, { bookings: filtered });
  }

  if (/^bookings\/[^/]+\/cancel$/.test(pathPart) && req.method === 'PATCH') {
    const bid = pathPart.split('/')[1];
    const b = state.bookingsById.get(bid);
    if (!b) return sendJson(res, 404, { detail: 'Booking not found' });
    b.status = 'CANCELLED';
    return sendJson(res, 200, { booking_id: bid, status: b.status });
  }

  if (/^bookings\/[^/]+\/reschedule$/.test(pathPart) && req.method === 'PATCH') {
    const bid = pathPart.split('/')[1];
    const b = state.bookingsById.get(bid);
    if (!b) return sendJson(res, 404, { detail: 'Booking not found' });
    const slot = req.body?.slot || '14:00';
    const when = req.body?.when || 'tomorrow';
    b.slot = slot;
    b.slot_datetime = `${when} ${slot}`;
    return sendJson(res, 200, {
      booking_id: bid,
      slot,
      slot_datetime: b.slot_datetime,
      when,
      message: 'Rescheduled successfully',
    });
  }

  if (/^bookings\/[^/]+\/confirm$/.test(pathPart) && req.method === 'POST') {
    const bid = pathPart.split('/')[1];
    const b = state.bookingsById.get(bid);
    if (!b) return sendJson(res, 404, { detail: 'Booking not found' });
    b.status = 'CONFIRMED';
    return sendJson(res, 200, { booking_id: bid, status: b.status });
  }

  if (/^bookings\/[^/]+\/start$/.test(pathPart) && req.method === 'POST') {
    const bid = pathPart.split('/')[1];
    const b = state.bookingsById.get(bid);
    if (!b) return sendJson(res, 404, { detail: 'Booking not found' });
    b.status = 'IN_PROGRESS';
    return sendJson(res, 200, { booking_id: bid, status: b.status });
  }

  if (/^trace\/[^/]+$/.test(pathPart) && req.method === 'GET') {
    const sid = pathPart.split('/')[1];
    const d = state.discoverBySession.get(sid);
    if (!d) return sendJson(res, 404, { detail: 'Trace not found' });
    return sendJson(res, 200, {
      session_id: sid,
      trace: d.trace || [],
      summary: d.trace_summary || { outcome: 'Completed' },
    });
  }

  if (pathPart === 'auth/sync' && req.method === 'POST') {
    const name = req.body?.display_name || 'Guest';
    const phone = req.body?.phone || '+923000000000';
    return sendJson(res, 200, {
      user_id: `USR_${randomUUID().slice(0, 8)}`,
      token: `edge_${randomUUID().replace(/-/g, '')}`,
      name,
      phone,
    });
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

  // Always prefer edge handlers so Vercel deploy works fully even if Render is down.
  if (await handleEdgeApi(normalizedPath, req, res)) return;

  if (useRenderProxy()) {
    const upstream = await tryUpstream(normalizedPath, req);
    if (upstream && !upstream.error) {
      sendUpstream(res, upstream);
      return;
    }
    if (upstream?.error) {
      return sendJson(res, 502, {
        detail: `Cannot reach Render at ${upstreamBase()}: ${upstream.error}. Edge route also unavailable for /api/${normalizedPath}.`,
      });
    }
  }

  return sendJson(res, 404, {
    detail: `Unknown route /api/${normalizedPath}. For full backend set KHIDMAT_USE_RENDER=1 and a live KHIDMAT_API_UPSTREAM.`,
  });
}

module.exports = { handleApi, upstreamBase, useRenderProxy };
