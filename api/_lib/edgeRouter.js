const { runDiscover } = require('./orchestrateDiscover');
const { sendOtp, verifyOtp } = require('./edgeAuth');

function useEdgeFirst() {
  return process.env.KHIDMAT_EDGE_API !== '0';
}

async function tryUpstream(pathPart, req) {
  const raw =
    process.env.KHIDMAT_API_UPSTREAM ||
    process.env.EXPO_PUBLIC_API_URL ||
    'https://khidmatai-api.onrender.com';
  const base = String(raw).replace(/\/$/, '');
  const target = new URL(`${base}/api/${pathPart}`);
  const headers = { 'Content-Type': 'application/json' };
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;

  const init = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body != null) {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }
  const upstream = await fetch(target.toString(), init);
  if (upstream.status === 404 || upstream.status === 502) return null;
  const text = await upstream.text();
  return { status: upstream.status, body: text, contentType: upstream.headers.get('content-type') };
}

function sendJson(res, status, data) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(data);
}

/** Route known API paths on Vercel edge (no Render required). Returns true if handled. */
async function handleEdgeApi(pathPart, req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
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
    const phone = req.body?.phone || '';
    sendJson(res, 200, sendOtp(phone));
    return true;
  }

  if (pathPart === 'auth/verify' && req.method === 'POST') {
    try {
      const { phone, otp, name } = req.body || {};
      const data = verifyOtp(phone, otp, name);
      sendJson(res, 200, data);
    } catch (e) {
      sendJson(res, 400, { detail: e instanceof Error ? e.message : String(e) });
    }
    return true;
  }

  return false;
}

async function handleApi(pathPart, req, res) {
  if (await handleEdgeApi(pathPart, req, res)) return;

  if (process.env.KHIDMAT_USE_RENDER === '1') {
    const upstream = await tryUpstream(pathPart, req);
    if (upstream) {
      res.status(upstream.status);
      res.setHeader('Content-Type', upstream.contentType || 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(upstream.body);
    }
  }

  return sendJson(res, 404, {
    detail: `Route not available on edge: ${pathPart}. Enable Render with KHIDMAT_USE_RENDER=1 for full backend.`,
  });
}

module.exports = { handleApi, useEdgeFirst };
