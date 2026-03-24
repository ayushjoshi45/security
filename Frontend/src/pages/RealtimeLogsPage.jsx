import { useRealtimeLogs } from '../hooks/useRealtimeLogs';

function RealtimeLogsPage() {
  const { logs, connected } = useRealtimeLogs(150);

  return (
    <div className="stack fade-in">
      <section className="card">
        <h2>Realtime Logs</h2>
        <p className="muted">
          Socket status: <strong>{connected ? 'Connected' : 'Disconnected'}</strong>
        </p>
      </section>

      <section className="card logs-card">
        <div className="log-list">
          {logs.length === 0 ? (
            <p className="muted">No logs yet.</p>
          ) : (
            logs.map((entry, index) => (
              <article key={`${entry.timestamp}-${index}`} className={`log-item log-item--${entry.level}`}>
                <header>
                  <span>{entry.event}</span>
                  <time>{entry.timestamp}</time>
                </header>
                <p>{entry.message}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default RealtimeLogsPage;
