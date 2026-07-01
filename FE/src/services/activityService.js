import { apiGet } from './apiClient';

export const getActivityLogsApi = () => apiGet('/activity-logs');
