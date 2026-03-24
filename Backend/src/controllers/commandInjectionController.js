const { testCommandInjection } = require('../services/commandInjectionService');

async function runCommandInjectionTest(req, res) {
  try {
    const { url, inputs, method, timeoutMs } = req.body || {};

    const result = await testCommandInjection({
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
  runCommandInjectionTest
};
