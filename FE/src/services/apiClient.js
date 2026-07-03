export const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace(/\/$/, '');

const getToken = () => localStorage.getItem('accessToken');

const handleExpiredAuth = (response, data, token) => {
    if (!token || (response.status !== 401 && response.status !== 403)) return;
    const message = data.message || '';
    const isAuthError = response.status === 401
        || message.includes('hết hạn')
        || message.includes('token')
        || message.includes('đăng nhập');
    if (isAuthError) window.dispatchEvent(new CustomEvent('auth:expired'));
};

const parseResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const data = await response.json();
        return { ...data, status: response.status };
    }

    return {
        success: false,
        status: response.status,
        message: response.status === 404
            ? 'Không tìm thấy API trên backend. Hãy khởi động lại backend bằng mã nguồn mới nhất.'
            : `Máy chủ trả về phản hồi không hợp lệ (HTTP ${response.status}).`,
    };
};

export const apiClient = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
        const data = await parseResponse(response);

        handleExpiredAuth(response, data, token);

        return data;
    } catch {
        return { success: false, status: 0, message: 'Không thể kết nối tới máy chủ.' };
    }
};

export const apiGet = (endpoint) => apiClient(endpoint, { method: 'GET' });
export const apiPost = (endpoint, body) =>
    apiClient(endpoint, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = (endpoint, body) =>
    apiClient(endpoint, { method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = (endpoint) => apiClient(endpoint, { method: 'DELETE' });
export const apiPatch = (endpoint, body) =>
    apiClient(endpoint, { method: 'PATCH', body: JSON.stringify(body) });

export const apiUpload = async (endpoint, formData) => {
    const token = getToken();
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });
        const data = await parseResponse(response);
        handleExpiredAuth(response, data, token);
        return data;
    } catch {
        return { success: false, status: 0, message: 'Không thể kết nối tới máy chủ.' };
    }
};
