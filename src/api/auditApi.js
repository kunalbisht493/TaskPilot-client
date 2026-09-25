import { apiClient } from './client.js';

export const auditApi = {
  getLogs: (params = {}) => {
    const search = new URLSearchParams(params).toString();
    return apiClient(`/api/audit-logs${search ? '?' + search : ''}`);
  },
  getStats: () => apiClient('/api/audit-logs/stats'),
};
