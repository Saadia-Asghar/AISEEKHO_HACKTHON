const { handleApi } = require('./_lib/edgeRouter');

/** POST /api/discover */
module.exports = async function handler(req, res) {
  return handleApi('discover', req, res);
};
