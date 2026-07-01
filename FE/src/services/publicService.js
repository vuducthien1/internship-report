import { apiGet, apiPost } from './apiClient';

export const getPublicStatsApi = () => apiGet('/public/stats');
export const submitContactApi = (payload) => apiPost('/public/contact', payload);
