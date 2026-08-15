import { fetchJson } from './api.js';

export const getExperiments = (projectId) => fetchJson(`/projects/${projectId}/experiments`);
export const createExperiment = (projectId, payload) =>
  fetchJson(`/projects/${projectId}/experiments`, { method: 'POST', body: JSON.stringify(payload) });
export const updateExperiment = (projectId, experimentId, payload) =>
  fetchJson(`/projects/${projectId}/experiments/${experimentId}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteExperiment = (projectId, experimentId) =>
  fetchJson(`/projects/${projectId}/experiments/${experimentId}`, { method: 'DELETE' });
export const addExperimentIteration = (projectId, experimentId, payload) =>
  fetchJson(`/projects/${projectId}/experiments/${experimentId}/iterations`, { method: 'POST', body: JSON.stringify(payload) });
