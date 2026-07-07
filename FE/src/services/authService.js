import { apiGet, apiPost } from './apiClient';

export const loginApi = (username, password) =>
    apiPost('/auth/login', { username, password });

export const logoutApi = () => apiPost('/auth/logout');
export const getCurrentSessionApi = () => apiGet('/auth/me');

export const registerApi = (userData) => apiPost('/auth/register', userData);

export const verifyEmailApi = (token) => apiPost('/auth/verify-email', { token });
export const resendVerificationApi = (email) => apiPost('/auth/resend-verification', { email });
export const forgotPasswordApi = (email) => apiPost('/auth/forgot-password', { email });
export const resetPasswordApi = (payload) => apiPost('/auth/reset-password', payload);

export const checkRoleApi = () => apiGet('/auth/check-role');
