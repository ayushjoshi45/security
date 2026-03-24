const { testNoSqlInjection } = require('../services/noSqlInjectionService');

async function runNoSqlInjectionTest(req, res) {
  try {
    const { url, inputs, method, timeoutMs } = req.body || {};

    const result = await testNoSqlInjection({
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
  runNoSqlInjectionTest
};
