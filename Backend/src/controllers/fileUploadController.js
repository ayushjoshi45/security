const { testFileUpload } = require('../services/fileUploadService');

async function runFileUploadTest(req, res) {
  try {
    const { url, fieldName, timeoutMs } = req.body || {};

    const result = await testFileUpload({
      url,
      fieldName,
      timeoutMs
    });

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  runFileUploadTest
};
