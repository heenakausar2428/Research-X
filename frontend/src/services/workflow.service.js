import { fetchJson } from './api.js';

export const getWorkflowCards = (projectId) => fetchJson(`/projects/${projectId}/workflow`);
export const createWorkflowCard = (projectId, payload) => fetchJson(`/projects/${projectId}/workflow`, { method: 'POST', body: JSON.stringify(payload) });
export const updateWorkflowCard = (projectId, cardId, payload) => fetchJson(`/projects/${projectId}/workflow/${cardId}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteWorkflowCard = (projectId, cardId) => fetchJson(`/projects/${projectId}/workflow/${cardId}`, { method: 'DELETE' });
