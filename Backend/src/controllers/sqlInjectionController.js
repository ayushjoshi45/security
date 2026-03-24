const { testSqlInjection } = require('../services/sqlInjectionService');

async function runSqlInjectionTest(req, res) {
  try {
    const { url, inputs, method, timeoutMs } = req.body || {};

    const result = await testSqlInjection({
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
  runSqlInjectionTest
};
