import { apiGet, apiPatch } from './apiClient';

export const getManagersApi = (search = '') =>
    apiGet(`/users/managers${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const getEngineersApi = (search = '') =>
    apiGet(`/users/engineers${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const getAllUsersApi = (search = '') =>
    apiGet(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const updateUserStatusApi = (userId, status) =>
    apiPatch(`/users/${userId}/status`, { status });

export const updateUserRoleApi = (userId, role) =>
    apiPatch(`/users/${userId}/role`, { role });

export const getMyProfileApi = () => apiGet('/users/me');
export const updateMyProfileApi = (profile) => apiPatch('/users/me', profile);
export const changeMyPasswordApi = (passwords) => apiPatch('/users/me/password', passwords);
export const adminUpdateUserProfileApi = (userId, profile) =>
    apiPatch(`/users/${userId}/profile`, profile);
