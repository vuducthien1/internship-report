export const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace(/\/$/, '');

let refreshPromise = null;

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

const requestRefresh = async () => {
    if (!refreshPromise) {
        refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        })
            .then(async (response) => ({ response, data: await parseResponse(response) }))
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
};

export const refreshAuthSession = async () => {
    try {
        const { response, data } = await requestRefresh();
        return response.ok && data.success ? data : null;
    } catch {
        return null;
    }
};

const makeRequest = async (endpoint, options = {}, allowRefresh = true) => {
    const isFormData = options.body instanceof FormData;
    const headers = {
        ...(!isFormData && options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
    };
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
    });
    const data = await parseResponse(response);

    if (response.status === 401 && allowRefresh) {
        const refreshed = await refreshAuthSession();
        if (refreshed) return makeRequest(endpoint, options, false);
        window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    return data;
};

export const apiClient = async (endpoint, options = {}) => {
    try {
        return await makeRequest(endpoint, options);
    } catch {
        return { success: false, status: 0, message: 'Không thể kết nối tới máy chủ.' };
    }
};

export const apiGet = (endpoint) => apiClient(endpoint, { method: 'GET' });
export const apiPost = (endpoint, body) => apiClient(endpoint, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
export const apiPut = (endpoint, body) => apiClient(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
});
export const apiDelete = (endpoint) => apiClient(endpoint, { method: 'DELETE' });
export const apiPatch = (endpoint, body) => apiClient(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
});
export const apiUpload = (endpoint, formData) => apiClient(endpoint, {
    method: 'POST',
    body: formData,
});
