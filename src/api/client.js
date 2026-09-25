export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Standard HTTP client adhering to Part 1 security rules:
 * - Credentials included for HttpOnly cookie persistence (no localStorage storage of JWT)
 * - Safe response parsing
 * - No sensitive data leakage in console logs
 */
export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || `Request failed with status ${res.status}`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // Clean error logging without leaking tokens
    console.error(`API request failed [${options.method || 'GET'} ${endpoint}]: ${err.message}`);
    throw err;
  }
}
