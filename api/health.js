/** GET /health — edge AI always on; reports Render status when KHIDMAT_USE_RENDER=1. */
function upstreamBase() {
  const raw =
    process.env.KHIDMAT_API_UPSTREAM ||
    process.env.EXPO_PUBLIC_API_URL ||
    'https://khidmatai-api.onrender.com';
  return String(raw).replace(/\/$/, '');
}

export default async function handler(_req, res) {
  const useRender =
    process.env.KHIDMAT_USE_RENDER === '1' || process.env.KHIDMAT_USE_RENDER === 'true';
  let renderOk = false;
  if (useRender) {
    try {
      const r = await fetch(`${upstreamBase()}/health`);
      renderOk = r.ok;
    } catch {
      renderOk = false;
    }
  }

  res.status(200);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'ok',
    agents: 6,
    mode: useRender ? (renderOk ? 'vercel-proxy-render' : 'vercel-proxy-render-down') : 'vercel-edge',
    discover: true,
    render_upstream: useRender ? upstreamBase() : null,
    render_reachable: renderOk,
    gemini: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
  });
}
