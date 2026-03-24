const { scanWebsitePipeline } = require('./pipelineService');
const { generateReport } = require('./reportService');

const scanJobs = new Map();
const MAX_TRACKED_SCANS = 100;

function generateScanId() {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${randomPart}`;
}

function cleanupTrackedScans() {
  if (scanJobs.size <= MAX_TRACKED_SCANS) {
    return;
  }

  const jobs = Array.from(scanJobs.values()).sort(
    (left, right) => new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime()
  );

  const removeCount = scanJobs.size - MAX_TRACKED_SCANS;
  for (let index = 0; index < removeCount; index += 1) {
    scanJobs.delete(jobs[index].scanId);
  }
}

function buildScanSummary(result, report) {
  return {
    totalPagesScanned: result.totalPagesScanned,
    totalFormsScanned: result.totalFormsScanned,
    totalChecksExecuted: result.totalChecksExecuted,
    totalVulnerabilities: result.totalVulnerabilities,
    severityCounts: result.severityCounts,
    riskLevel: report?.riskLevel,
    riskScore: report?.riskScore
  };
}

function toPublicJob(job) {
  const response = {
    scanId: job.scanId,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    input: job.input
  };

  if (job.status === 'completed') {
    response.completedAt = job.completedAt;
    response.summary = buildScanSummary(job.result, job.report);
    response.result = job.result;
    response.report = job.report;
  }

  if (job.status === 'failed') {
    response.failedAt = job.failedAt;
    response.error = job.error;
  }

  return response;
}

function runScanInBackground(scanId) {
  Promise.resolve()
    .then(async () => {
      const job = scanJobs.get(scanId);
      if (!job) {
        return;
      }

      const result = await scanWebsitePipeline(job.input.url, job.input.options);
      const report = generateReport(result);

      scanJobs.set(scanId, {
        ...job,
        status: 'completed',
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        result,
        report
      });
    })
    .catch((error) => {
      const job = scanJobs.get(scanId);
      if (!job) {
        return;
      }

      scanJobs.set(scanId, {
        ...job,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        failedAt: new Date().toISOString(),
        error: error.message
      });
    });
}

function createTrackedScan(url, options) {
  const now = new Date().toISOString();
  const scanId = generateScanId();

  const job = {
    scanId,
    status: 'running',
    createdAt: now,
    updatedAt: now,
    input: {
      url,
      options
    }
  };

  scanJobs.set(scanId, job);
  cleanupTrackedScans();
  runScanInBackground(scanId);

  return toPublicJob(job);
}

function getTrackedScan(scanId) {
  const job = scanJobs.get(scanId);
  if (!job) {
    return null;
  }

  return toPublicJob(job);
}

module.exports = {
  createTrackedScan,
  getTrackedScan
};
