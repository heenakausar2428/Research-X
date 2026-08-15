import { fetchJson } from './api.js';

export const getLiterature = (projectId) => fetchJson(`/projects/${projectId}/literature`);

export const uploadLiterature = async (projectId, formData) => {
  const getApiBase = () => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
  };
  const API_BASE = getApiBase();
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE}/projects/${projectId}/literature`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Upload failed');
  }

  return data;
};
