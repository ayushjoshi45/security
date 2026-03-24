function SeverityPanel({ title, counts = {}, total = 0 }) {
  const high = counts.High || 0;
  const medium = counts.Medium || 0;
  const low = counts.Low || 0;

  return (
    <section className="card severity-card">
      <h2>{title}</h2>
      <p className="muted">Total vulnerabilities: {total}</p>
      <div className="severity-bars">
        <div>
          <span>High</span>
          <progress value={high} max={Math.max(total, 1)} />
          <strong>{high}</strong>
        </div>
        <div>
          <span>Medium</span>
          <progress value={medium} max={Math.max(total, 1)} />
          <strong>{medium}</strong>
        </div>
        <div>
          <span>Low</span>
          <progress value={low} max={Math.max(total, 1)} />
          <strong>{low}</strong>
        </div>
      </div>
    </section>
  );
}

export default SeverityPanel;
