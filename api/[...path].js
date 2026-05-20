const { handleApi } = require('./_lib/edgeRouter');

/**
 * /api/* catch-all — booking, payments, trace, etc.
 * Auth + discover also have explicit files in api/ for reliable routing.
 */
async function handler(req, res) {
  const segments = req.query.path;
  const pathPart = Array.isArray(segments) ? segments.join('/') : segments || '';
  return handleApi(pathPart, req, res);
}

module.exports = handler;
module.exports.default = handler;
