import { useState } from 'react';

const initialState = {
  url: 'https://example.com',
  depth: 1,
  maxPages: 5,
  timeoutMs: 10000,
  includeExternal: false
};

function ScanForm({ title, onSubmit, loading, buttonLabel }) {
  const [form, setForm] = useState(initialState);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      depth: Number(form.depth),
      maxPages: Number(form.maxPages),
      timeoutMs: Number(form.timeoutMs)
    });
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <h2>{title}</h2>
      <label>
        Target URL
        <input
          type="url"
          value={form.url}
          onChange={(event) => updateField('url', event.target.value)}
          placeholder="https://example.com"
          required
        />
      </label>

      <div className="grid-two">
        <label>
          Depth
          <input
            type="number"
            min="0"
            max="5"
            value={form.depth}
            onChange={(event) => updateField('depth', event.target.value)}
          />
        </label>

        <label>
          Max Pages
          <input
            type="number"
            min="1"
            max="100"
            value={form.maxPages}
            onChange={(event) => updateField('maxPages', event.target.value)}
          />
        </label>
      </div>

      <div className="grid-two">
        <label>
          Timeout (ms)
          <input
            type="number"
            min="1000"
            step="500"
            value={form.timeoutMs}
            onChange={(event) => updateField('timeoutMs', event.target.value)}
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.includeExternal}
            onChange={(event) => updateField('includeExternal', event.target.checked)}
          />
          Include external links
        </label>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Running...' : buttonLabel}
      </button>
    </form>
  );
}

export default ScanForm;
