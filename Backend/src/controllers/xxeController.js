const { testXxe } = require('../services/xxeService');

async function runXxeTest(req, res) {
  try {
    const { url, method, timeoutMs } = req.body || {};

    const result = await testXxe({
      url,
      method,
      timeoutMs
    });

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  runXxeTest
};
