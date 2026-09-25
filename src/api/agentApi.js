import { apiClient } from './client.js';

export const agentApi = {
  startTask: ({ goal, conversationId }) => apiClient('/api/agent/task', {
    method: 'POST',
    body: JSON.stringify({ goal, conversationId }),
  }),
  confirmAction: ({ confirmationId, approved }) => apiClient('/api/agent/confirm', {
    method: 'POST',
    body: JSON.stringify({ confirmationId, approved }),
  }),
  getPendingConfirmations: () => apiClient('/api/agent/confirmations/pending'),
};
