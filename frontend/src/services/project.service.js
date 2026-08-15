import { fetchJson } from './api.js';

export const getProjects = () => fetchJson('/projects');
export const getProject = (projectId) => fetchJson(`/projects/${projectId}`);
export const createProject = (payload) => fetchJson('/projects', { method: 'POST', body: JSON.stringify(payload) });
export const updateProject = (projectId, payload) => fetchJson(`/projects/${projectId}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteProject = (projectId) => fetchJson(`/projects/${projectId}`, { method: 'DELETE' });

export const getCollaborators = (projectId) => fetchJson(`/projects/${projectId}/collaborators`);
export const addCollaborator = (projectId, payload) => fetchJson(`/projects/${projectId}/collaborators`, { method: 'POST', body: JSON.stringify(payload) });
export const removeCollaborator = (projectId, userId) => fetchJson(`/projects/${projectId}/collaborators/${userId}`, { method: 'DELETE' });

