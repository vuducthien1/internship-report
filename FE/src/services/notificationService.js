import { apiGet, apiPatch } from './apiClient';

export const getNotificationsApi = () => apiGet('/notifications?limit=30');
export const markNotificationReadApi = (id) => apiPatch(`/notifications/${id}/read`, {});
export const markAllNotificationsReadApi = () => apiPatch('/notifications/read-all', {});
