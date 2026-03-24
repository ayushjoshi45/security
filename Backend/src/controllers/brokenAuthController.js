const { testBrokenAuthentication } = require('../services/brokenAuthService');

async function runBrokenAuthTest(req, res) {
  try {
    const {
      url,
      method,
      timeoutMs,
      usernameField,
      passwordField,
      body
    } = req.body || {};

    const result = await testBrokenAuthentication({
      url,
      method,
      timeoutMs,
      usernameField,
      passwordField,
      body
    });

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  runBrokenAuthTest
};
