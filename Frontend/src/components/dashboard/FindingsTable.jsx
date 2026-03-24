function FindingsTable({ title, findings = [] }) {
  return (
    <section className="card findings-card">
      <h2>{title}</h2>
      {findings.length === 0 ? (
        <p className="muted">No findings available yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Severity</th>
                <th>Scope</th>
                <th>Page</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((item, index) => (
                <tr key={`${item.type}-${index}`}>
                  <td>{item.type}</td>
                  <td>{item.severity}</td>
                  <td>{item.scope}</td>
                  <td className="cell-url">{item.pageUrl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default FindingsTable;
