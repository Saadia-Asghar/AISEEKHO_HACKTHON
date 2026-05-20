/** GET /health — edge AI is always available on Vercel. */
export default function handler(_req, res) {
  const useRender = process.env.KHIDMAT_USE_RENDER === '1';
  res.status(200);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'ok',
    agents: 6,
    mode: useRender ? 'vercel-proxy+edge' : 'vercel-edge',
    discover: true,
    render_optional: !useRender,
    gemini: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
  });
}
