const { runDiscover } = require('./orchestrateDiscover');
const { sendOtp, verifyOtp } = require('./edgeAuth');

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
