const { testXss } = require('../services/xssService');

async function runXssTest(req, res) {
  try {
    const { url, inputs, method, timeoutMs } = req.body || {};

    const result = await testXss({
      url,
      inputs,
      method,
      timeoutMs
    });

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  runXssTest
};
