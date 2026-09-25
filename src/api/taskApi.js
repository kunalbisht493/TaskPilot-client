import { apiClient } from './client.js';

export const taskApi = {
  getTasks: (params = {}) => {
    const search = new URLSearchParams(params).toString();
    return apiClient(`/api/tasks${search ? '?' + search : ''}`);
  },
  createTask: (taskData) => apiClient('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  }),
  completeTask: (taskId) => apiClient(`/api/tasks/${taskId}/complete`, {
    method: 'PATCH',
  }),
  deleteTask: (taskId) => apiClient(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  }),
};
