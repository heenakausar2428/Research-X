import { fetchJson } from './api.js';

export const getConceptGraph = (projectId) => fetchJson(`/projects/${projectId}/concepts`);
export const createConceptNode = (projectId, payload) => fetchJson(`/projects/${projectId}/concepts/nodes`, { method: 'POST', body: JSON.stringify(payload) });
export const updateConceptNode = (projectId, nodeId, payload) => fetchJson(`/projects/${projectId}/concepts/nodes/${nodeId}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteConceptNode = (projectId, nodeId) => fetchJson(`/projects/${projectId}/concepts/nodes/${nodeId}`, { method: 'DELETE' });
export const getLineageGraph = (projectId, nodeId) => fetchJson(`/projects/${projectId}/concepts/lineage/${nodeId}`);
export const createEdge = (projectId, payload) => fetchJson(`/projects/${projectId}/concepts/edges`, { method: 'POST', body: JSON.stringify(payload) });
export const deleteEdge = (projectId, edgeId) => fetchJson(`/projects/${projectId}/concepts/edges/${edgeId}`, { method: 'DELETE' });
