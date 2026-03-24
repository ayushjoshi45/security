const { testSensitiveDataExposure } = require('../services/sensitiveDataExposureService');

async function runSensitiveDataExposureTest(req, res) {
  try {
    const url = req.body?.url || req.query?.url;
    const timeoutMs = req.body?.timeoutMs;

    const result = await testSensitiveDataExposure({
      url,
      timeoutMs
    });

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  runSensitiveDataExposureTest
};
