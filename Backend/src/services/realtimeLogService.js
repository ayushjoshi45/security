let ioInstance = null;
const logBuffer = [];
const MAX_LOGS = 500;

function bindRealtimeIo(io) {
  ioInstance = io;
}

function normalizeLimit(limit, fallback = 100) {
  const parsed = Number.parseInt(limit, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, MAX_LOGS);
}

function pushLog(entry) {
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.splice(0, logBuffer.length - MAX_LOGS);
  }
}

function emitRealtimeLog(level, event, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level || 'info',
    event: event || 'log',
    message: message || '',
    meta: meta || {}
  };

  pushLog(entry);

  if (ioInstance) {
    ioInstance.emit('log', entry);
  }

  return entry;
}

function getRecentLogs(limit = 100) {
  const safeLimit = normalizeLimit(limit, 100);
  return logBuffer.slice(-safeLimit);
}

module.exports = {
  bindRealtimeIo,
  emitRealtimeLog,
  getRecentLogs
};
