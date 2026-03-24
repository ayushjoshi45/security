const DEFAULT_API_URL_PRODUCTION = 'https://security-khom.onrender.com';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : DEFAULT_API_URL_PRODUCTION);

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    payload = { raw: text };
  }

  if (!response.ok) {
    const message = payload?.error || payload?.detail || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
