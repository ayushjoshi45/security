import { apiRequest } from './client';

export function runScan(body) {
  return apiRequest('/api/scan', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function createTrackedScan(body) {
  return apiRequest('/api/scan/track', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function getTrackedScanStatus(scanId) {
  return apiRequest(`/api/scan/status/${encodeURIComponent(scanId)}`);
}

export function getRecentLogs(limit = 100) {
  return apiRequest(`/api/scan/logs?limit=${encodeURIComponent(limit)}`);
}
