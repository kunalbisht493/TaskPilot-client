import { apiClient, API_BASE } from './client.js';

export const authApi = {
  getMe: () => apiClient('/api/auth/me'),
  devLogin: (userData = {}) => apiClient('/api/auth/dev-login', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  logout: () => apiClient('/api/auth/logout', { method: 'POST' }),
  getGoogleConnectUrl: (returnTo) => {
    const origin = returnTo || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${API_BASE}/api/auth/google${origin ? `?returnTo=${encodeURIComponent(origin)}` : ''}`;
  },
  getHealth: () => apiClient('/api/health'),
  getTools: () => apiClient('/api/tools'),
};
