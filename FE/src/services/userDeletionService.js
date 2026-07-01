import { apiGet, apiPatch, apiPost } from './apiClient';

export const getDeletionCandidatesApi = () => apiGet('/user-deletions/candidates');
export const getDeletionRequestsApi = () => apiGet('/user-deletions/requests');
export const requestUserDeletionApi = (userId, reason) => apiPost('/user-deletions/requests', { user_id: userId, reason });
export const directDeleteUserApi = (userId, reason) => apiPost('/user-deletions/direct', { user_id: userId, reason });
export const reviewDeletionRequestApi = (id, decision, reviewNote) => apiPatch(`/user-deletions/requests/${id}/review`, { decision, review_note: reviewNote });
export const getDeletedUsersApi = () => apiGet('/user-deletions/deleted');
export const restoreDeletedUserApi = (id) => apiPatch(`/user-deletions/deleted/${id}/restore`, {});
