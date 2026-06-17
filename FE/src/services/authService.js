const API_URL = "http://localhost:5000/api/auth";

export const loginApi = async (username, password) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return response.json();
};

// [MỚI] Hàm gọi API Đăng ký
export const registerApi = async (userData) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData) // Gửi toàn bộ cục data xuống
    });
    return response.json();
};