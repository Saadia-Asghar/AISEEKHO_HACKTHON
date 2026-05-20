const { handleApi } = require('./_lib/edgeRouter');

/**
 * /api/* — AI discover + demo auth run on Vercel (no Render).
 * Optional: set KHIDMAT_USE_RENDER=1 and KHIDMAT_API_UPSTREAM for full FastAPI backend.
 */
export default async function handler(req, res) {
  const segments = req.query.path;
  const pathPart = Array.isArray(segments) ? segments.join('/') : segments || '';
  return handleApi(pathPart, req, res);
}
