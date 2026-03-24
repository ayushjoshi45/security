const { testPathTraversal } = require('../services/pathTraversalService');

async function runPathTraversalTest(req, res) {
  try {
    const { url, timeoutMs, paramNames } = req.body || {};

    const result = await testPathTraversal({
      url,
      timeoutMs,
      paramNames
    });

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  runPathTraversalTest
};
