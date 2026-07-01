import { apiGet, apiPatch, apiPost, apiUpload, BASE_URL } from './apiClient';

export const createReportApi = (reportData, attachment) => {
    if (!attachment) return apiPost('/reports', reportData);
    const formData = new FormData();
    Object.entries(reportData).forEach(([key, value]) => formData.append(key, value ?? ''));
    formData.append('attachment', attachment);
    return apiUpload('/reports', formData);
};
export const getReportsApi = () => apiGet('/reports');
export const reviewReportApi = (reportId, review) =>
    apiPatch(`/reports/${reportId}/review`, review);

export const getReportMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BASE_URL.replace(/\/api\/?$/, '')}${path}`;
};
