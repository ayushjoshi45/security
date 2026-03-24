import { NavLink, Outlet } from 'react-router-dom';

function DashboardLayout({ routes }) {
  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <p className="brand">Security Scanner</p>
        <p className="brand-subtitle">SECaaS Control Room</p>
        <nav className="nav">
          {routes.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              end={route.path === '/'}
              className={({ isActive }) =>
                isActive ? 'nav__link nav__link--active' : 'nav__link'
              }
            >
              {route.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="shell__content">
        <header className="topbar">
          <h1>Frontend Dashboard</h1>
          <p>Scan operations, status tracking, and realtime logs</p>
        </header>
        <section className="page-wrap">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default DashboardLayout;
