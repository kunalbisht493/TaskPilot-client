import { apiClient } from './client.js';

export const agentApi = {
  startTask: ({ goal, conversationId, sessionId }) => apiClient('/api/agent/task', {
    method: 'POST',
    body: JSON.stringify({ goal, conversationId, sessionId }),
  }),
  confirmAction: ({ confirmationId, approved, conversationId, sessionId }) => apiClient('/api/agent/confirm', {
    method: 'POST',
    body: JSON.stringify({ confirmationId, approved, conversationId, sessionId }),
  }),
  getPendingConfirmations: () => apiClient('/api/agent/confirmations/pending'),
};
