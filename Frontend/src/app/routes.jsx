import DashboardPage from '../pages/DashboardPage';
import RealtimeLogsPage from '../pages/RealtimeLogsPage';
import ScanStatusPage from '../pages/ScanStatusPage';

export const appRoutes = [
  {
    path: '/',
    label: 'Dashboard',
    element: <DashboardPage />
  },
  {
    path: '/status',
    label: 'Track Scan',
    element: <ScanStatusPage />
  },
  {
    path: '/logs',
    label: 'Realtime Logs',
    element: <RealtimeLogsPage />
  }
];
