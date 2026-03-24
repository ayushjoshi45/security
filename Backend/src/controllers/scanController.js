const { scanWebsitePipeline } = require('../services/pipelineService');
const { generateReport } = require('../services/reportService');
const { createTrackedScan, getTrackedScan } = require('../services/scanTrackingService');
const { emitRealtimeLog, getRecentLogs } = require('../services/realtimeLogService');

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

    emitRealtimeLog('info', 'scan.sync.started', 'Synchronous scan started', {
      url,
      options
    });

    const result = await scanWebsitePipeline(url, {
      ...options,
      onLog: (event, message, meta) =>
        emitRealtimeLog('info', `pipeline.${event}`, message, {
          url,
          ...(meta || {})
        })
    });

    const report = generateReport(result);

    emitRealtimeLog('info', 'scan.sync.completed', 'Synchronous scan completed', {
      url,
      totalVulnerabilities: result.totalVulnerabilities,
      riskLevel: report.riskLevel
    });

    return res.json({
      ...result,
      report
    });
  } catch (error) {
    emitRealtimeLog('error', 'scan.sync.failed', 'Synchronous scan failed', {
      error: error.message
    });
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
    emitRealtimeLog('info', 'scan.tracked.created', 'Tracked scan created', {
      scanId: job.scanId,
      url
    });
    return res.status(202).json(job);
  } catch (error) {
    emitRealtimeLog('error', 'scan.tracked.create_failed', 'Failed to create tracked scan', {
      error: error.message
    });
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

function listRealtimeLogs(req, res) {
  try {
    const limit = parseNumber(req.query?.limit, 100);
    const logs = getRecentLogs(limit);

    return res.json({
      count: logs.length,
      logs
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch realtime logs', detail: error.message });
  }
}

module.exports = {
  createScan,
  createTrackedScanJob,
  getTrackedScanStatus,
  listRealtimeLogs
};
