import { useState } from 'react';
import ScanForm from '../components/dashboard/ScanForm';
import SeverityPanel from '../components/dashboard/SeverityPanel';
import FindingsTable from '../components/dashboard/FindingsTable';
import { runScan } from '../services/api/scanApi';
import { useTrackedScan } from '../hooks/useTrackedScan';

function DashboardPage() {
  const [syncResult, setSyncResult] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState('');

  const { job, loading: trackedLoading, error: trackedError, startTrackedScan } = useTrackedScan();

  async function handleSyncSubmit(payload) {
    try {
      setSyncLoading(true);
      setSyncError('');
      const result = await runScan(payload);
      setSyncResult(result);
    } catch (error) {
      setSyncError(error.message);
    } finally {
      setSyncLoading(false);
    }
  }

  return (
    <div className="page-grid fade-in">
      <div className="stack">
        <ScanForm
          title="Run Immediate Scan"
          onSubmit={handleSyncSubmit}
          loading={syncLoading}
          buttonLabel="Run Scan"
        />
        <ScanForm
          title="Start Tracked Scan"
          onSubmit={startTrackedScan}
          loading={trackedLoading}
          buttonLabel="Start Tracking"
        />
      </div>

      <div className="stack">
        <section className="card">
          <h2>Scan Health</h2>
          <p className="muted">Use immediate scan for quick checks and tracked scan for progress polling.</p>
          {syncError ? <p className="error">Immediate scan failed: {syncError}</p> : null}
          {trackedError ? <p className="error">Tracked scan failed: {trackedError}</p> : null}
          {job ? (
            <div className="status-box">
              <p><strong>Tracked Scan ID:</strong> {job.scanId}</p>
              <p><strong>Status:</strong> {job.status}</p>
              {job.summary ? <p><strong>Risk:</strong> {job.summary.riskLevel}</p> : null}
            </div>
          ) : null}
        </section>

        <SeverityPanel
          title="Immediate Scan Severity"
          counts={syncResult?.severityCounts}
          total={syncResult?.totalVulnerabilities || 0}
        />

        <FindingsTable
          title="Immediate Scan Findings"
          findings={syncResult?.vulnerabilities || []}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
