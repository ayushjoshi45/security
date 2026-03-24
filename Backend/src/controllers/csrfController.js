const { testCsrf } = require('../services/csrfService');

async function runCsrfTest(req, res) {
  try {
    const url = req.body?.url || req.query?.url;
    const result = await testCsrf(url);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  runCsrfTest
};
