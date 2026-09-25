export const API_BASE = import.meta.env.VITE_API_URL || '';

export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : (API_BASE ? `${API_BASE}${endpoint}` : endpoint);
  
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
    console.error(`API request failed [${options.method || 'GET'} ${endpoint}]: ${err.message}`);
    throw err;
  }
}
