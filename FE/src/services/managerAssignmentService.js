import { apiGet, apiPatch, apiPost } from './apiClient';

export const getManagerAssignmentsApi = () => apiGet('/manager-assignments');
export const createManagerAssignmentApi = (payload) => apiPost('/manager-assignments', payload);
export const updateManagerAssignmentApi = (id, payload) => apiPatch(`/manager-assignments/${id}/progress`, payload);
export const cancelManagerAssignmentApi = (id, reason) => apiPatch(`/manager-assignments/${id}/cancel`, { reason });
