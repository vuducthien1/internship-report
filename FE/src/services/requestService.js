import { apiGet, apiPatch, apiPost } from './apiClient';

export const getTaskRequestsApi = () => apiGet('/task-requests');
export const createTaskRequestApi = (payload) => apiPost('/task-requests', payload);
export const reviewTaskRequestApi = (id, payload) => apiPatch(`/task-requests/${id}/review`, payload);
