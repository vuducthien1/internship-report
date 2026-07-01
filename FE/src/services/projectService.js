import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getProjectsApi = () => apiGet('/projects');
export const getProjectByIdApi = (id) => apiGet(`/projects/${id}`);
export const getProjectWorkspaceApi = (id) => apiGet(`/projects/${id}/workspace`);
export const createProjectApi = (projectData) => apiPost('/projects', projectData);
export const updateProjectApi = (id, projectData) => apiPut(`/projects/${id}`, projectData);
export const deleteProjectApi = (id) => apiDelete(`/projects/${id}`);
