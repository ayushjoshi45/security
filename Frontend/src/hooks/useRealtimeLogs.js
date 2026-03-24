import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '../services/api/client';
import { getRecentLogs } from '../services/api/scanApi';

export function useRealtimeLogs(limit = 100) {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);

  const socketUrl = useMemo(() => getApiBaseUrl(), []);

  useEffect(() => {
    let isMounted = true;

    getRecentLogs(limit)
      .then((result) => {
        if (isMounted) {
          setLogs(result.logs || []);
        }
      })
      .catch(() => {
        // Keep UI usable even if preload fails.
      });

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('log', (entry) => {
      setLogs((previous) => {
        const updated = [...previous, entry];
        return updated.slice(-limit);
      });
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, [limit, socketUrl]);

  return {
    logs,
    connected
  };
}
