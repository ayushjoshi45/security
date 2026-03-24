const { scanWebsitePipeline } = require('../services/pipelineService');

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

async function runPipelineScan(req, res) {
  try {
    const body = req.body || {};
    const query = req.query || {};

    const baseUrl = body.baseUrl || body.url || query.baseUrl || query.url;
    const result = await scanWebsitePipeline(baseUrl, {
      depth: parseNumber(body.depth ?? query.depth, 1),
      maxPages: parseNumber(body.maxPages ?? query.maxPages, 20),
      includeExternal: parseBoolean(body.includeExternal ?? query.includeExternal, false),
      method: body.method || query.method || 'POST',
      timeoutMs: parseNumber(body.timeoutMs ?? query.timeoutMs, 10000)
    });

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  runPipelineScan
};
