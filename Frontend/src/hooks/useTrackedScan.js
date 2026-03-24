import { useCallback, useEffect, useRef, useState } from 'react';
import { createTrackedScan, getTrackedScanStatus } from '../services/api/scanApi';

export function useTrackedScan() {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  const clearPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refreshStatus = useCallback(async (scanId) => {
    const status = await getTrackedScanStatus(scanId);
    setJob(status);

    if (status.status !== 'running') {
      clearPolling();
      setLoading(false);
    }
  }, [clearPolling]);

  const startTrackedScan = useCallback(async (payload) => {
    try {
      setError('');
      setLoading(true);
      clearPolling();

      const created = await createTrackedScan(payload);
      setJob(created);

      pollRef.current = setInterval(() => {
        refreshStatus(created.scanId).catch((err) => {
          setError(err.message);
          setLoading(false);
          clearPolling();
        });
      }, 1500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [clearPolling, refreshStatus]);

  useEffect(() => () => clearPolling(), [clearPolling]);

  return {
    job,
    loading,
    error,
    startTrackedScan,
    refreshStatus
  };
}
