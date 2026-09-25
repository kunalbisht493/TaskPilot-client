import { apiClient, API_BASE } from './client.js';

export const authApi = {
  getMe: () => apiClient('/api/auth/me'),
  devLogin: (userData = {}) => apiClient('/api/auth/dev-login', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  logout: () => apiClient('/api/auth/logout', { method: 'POST' }),
  getGoogleConnectUrl: () => `${API_BASE}/api/auth/google`,
  getHealth: () => apiClient('/api/health'),
  getTools: () => apiClient('/api/tools'),
};
