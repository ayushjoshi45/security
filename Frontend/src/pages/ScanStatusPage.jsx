import { useState } from 'react';
import SeverityPanel from '../components/dashboard/SeverityPanel';
import FindingsTable from '../components/dashboard/FindingsTable';
import { getTrackedScanStatus } from '../services/api/scanApi';

function ScanStatusPage() {
  const [scanId, setScanId] = useState('');
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');

  async function handleFetchStatus(event) {
    event.preventDefault();
    try {
      setError('');
      const data = await getTrackedScanStatus(scanId.trim());
      setJob(data);
    } catch (err) {
      setError(err.message);
      setJob(null);
    }
  }

  return (
    <div className="stack fade-in">
      <form className="card form-card" onSubmit={handleFetchStatus}>
        <h2>Track Existing Scan</h2>
        <label>
          Scan ID
          <input
            type="text"
            value={scanId}
            onChange={(event) => setScanId(event.target.value)}
            placeholder="1774335266943-7p9r0cho"
            required
          />
        </label>
        <button type="submit">Get Status</button>
        {error ? <p className="error">{error}</p> : null}
      </form>

      {job ? (
        <section className="card">
          <h2>Tracked Scan Snapshot</h2>
          <p><strong>Scan ID:</strong> {job.scanId}</p>
          <p><strong>Status:</strong> {job.status}</p>
          <p><strong>Created:</strong> {job.createdAt}</p>
          {job.summary ? <p><strong>Risk:</strong> {job.summary.riskLevel}</p> : null}
        </section>
      ) : null}

      <SeverityPanel
        title="Tracked Severity"
        counts={job?.summary?.severityCounts}
        total={job?.summary?.totalVulnerabilities || 0}
      />

      <FindingsTable
        title="Tracked Findings"
        findings={job?.result?.vulnerabilities || []}
      />
    </div>
  );
}

export default ScanStatusPage;
