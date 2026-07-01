import { apiGet, apiPatch } from './apiClient';

export const getContactRequestsApi = () => apiGet('/contact-requests');
export const updateContactRequestApi = (id, status) => apiPatch(`/contact-requests/${id}`, { status });
