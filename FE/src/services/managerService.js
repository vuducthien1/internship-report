import { apiGet } from './apiClient';

export const getManagerDashboardApi = () => apiGet('/manager/dashboard');
export const getManagerKpisApi = () => apiGet('/manager/kpis');
