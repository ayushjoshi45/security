const { scanWebsitePipeline } = require('../services/pipelineService');
const { generateReport } = require('../services/reportService');

function parseNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return String(value).toLowerCase() === 'true';
}

async function createScan(req, res) {
  try {
    const body = req.body || {};
    const query = req.query || {};

    const url = body.url || body.baseUrl || query.url || query.baseUrl;
    if (!url) {
      return res.status(400).json({ error: 'Missing url in request' });
    }

    const result = await scanWebsitePipeline(url, {
      depth: parseNumber(body.depth ?? query.depth, 1),
      maxPages: parseNumber(body.maxPages ?? query.maxPages, 20),
      includeExternal: parseBoolean(body.includeExternal ?? query.includeExternal, false),
      method: body.method || query.method || 'POST',
      timeoutMs: parseNumber(body.timeoutMs ?? query.timeoutMs, 10000)
    });

    const report = generateReport(result);

    return res.json({
      ...result,
      report
    });
  } catch (error) {
    return res.status(500).json({ error: 'Scan failed', detail: error.message });
  }
}

module.exports = {
  createScan
};
