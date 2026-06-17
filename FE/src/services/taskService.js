const API_URL = "http://localhost:5000/api/tasks";

// Hàm lấy danh sách công việc của riêng Kỹ sư đang đăng nhập
export const getMyTasksApi = async () => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_URL}/my-tasks`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Trình thẻ Kỹ sư ra
        }
    });
    return response.json();
};