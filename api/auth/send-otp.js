const { handleApi } = require('../_lib/edgeRouter');

/** POST /api/auth/send-otp — explicit route so Vercel never 404s this path. */
module.exports = async function handler(req, res) {
  return handleApi('auth/send-otp', req, res);
};
