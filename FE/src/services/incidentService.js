import { BASE_URL, apiGet, apiPatch, apiUpload } from './apiClient';

export const getIncidentsApi = () => apiGet('/incidents');
export const createIncidentApi = (payload, image) => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) form.append(key, value);
    });
    if (image) form.append('image', image);
    return apiUpload('/incidents', form);
};
export const updateIncidentStatusApi = (id, payload) => apiPatch(`/incidents/${id}/status`, typeof payload === 'string' ? { status: payload } : payload);
export const uploadIncidentResolutionEvidenceApi = (id, image) => {
    const form = new FormData();
    form.append('image', image);
    return apiUpload(`/incidents/${id}/resolution-evidence`, form);
};
export const getIncidentImageUrl = (value) => value ? `${BASE_URL.replace(/\/api$/, '')}${value}` : '';
