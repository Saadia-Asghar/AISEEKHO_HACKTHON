const { handleApi } = require('../_lib/edgeRouter');

/** POST /api/auth/verify */
module.exports = async function handler(req, res) {
  return handleApi('auth/verify', req, res);
};
