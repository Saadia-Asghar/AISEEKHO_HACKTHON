const { handleApi } = require('./_lib/edgeRouter');

/** GET /api/suggestions?hour= */
module.exports = async function handler(req, res) {
  return handleApi('suggestions', req, res);
};
