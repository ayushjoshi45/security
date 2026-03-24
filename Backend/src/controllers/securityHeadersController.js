const { testSecurityHeaders } = require('../services/securityHeadersService');

async function runSecurityHeadersTest(req, res) {
  try {
    const url = req.body?.url || req.query?.url;
    const timeoutMs = req.body?.timeoutMs;

    const result = await testSecurityHeaders({
      url,
      timeoutMs
    });

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  runSecurityHeadersTest
};
