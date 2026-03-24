const { scanWebsitePipeline } = require('../services/pipelineService');
const { generateReport } = require('../services/reportService');
const { createTrackedScan, getTrackedScan } = require('../services/scanTrackingService');

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

function parseScanInput(req) {
  const body = req.body || {};
  const query = req.query || {};

  return {
    url: body.url || body.baseUrl || query.url || query.baseUrl,
    options: {
      depth: parseNumber(body.depth ?? query.depth, 1),
      maxPages: parseNumber(body.maxPages ?? query.maxPages, 20),
      includeExternal: parseBoolean(body.includeExternal ?? query.includeExternal, false),
      method: body.method || query.method || 'POST',
      timeoutMs: parseNumber(body.timeoutMs ?? query.timeoutMs, 10000)
    }
  };
}

async function createScan(req, res) {
  try {
    const { url, options } = parseScanInput(req);
    if (!url) {
      return res.status(400).json({ error: 'Missing url in request' });
    }

    const result = await scanWebsitePipeline(url, options);

    const report = generateReport(result);

    return res.json({
      ...result,
      report
    });
  } catch (error) {
    return res.status(500).json({ error: 'Scan failed', detail: error.message });
  }
}

function createTrackedScanJob(req, res) {
  try {
    const { url, options } = parseScanInput(req);
    if (!url) {
      return res.status(400).json({ error: 'Missing url in request' });
    }

    const job = createTrackedScan(url, options);
    return res.status(202).json(job);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create tracked scan', detail: error.message });
  }
}

function getTrackedScanStatus(req, res) {
  try {
    const scanId = req.params.scanId;
    if (!scanId) {
      return res.status(400).json({ error: 'Missing scanId' });
    }

    const job = getTrackedScan(scanId);
    if (!job) {
      return res.status(404).json({ error: 'Scan not found', scanId });
    }

    return res.json(job);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch scan status', detail: error.message });
  }
}

module.exports = {
  createScan,
  createTrackedScanJob,
  getTrackedScanStatus
};
