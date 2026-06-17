const API_URL = "http://localhost:5000/api/projects";

// Hàm lấy danh sách dự án
export const getProjectsApi = async () => {
    // Lấy token từ kho lưu trữ của trình duyệt
    const token = localStorage.getItem('accessToken'); 

    const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // [QUAN TRỌNG] Trình thẻ từ ra cho bảo vệ
        }
    });
    return response.json();
};

// Hàm gửi dữ liệu tạo dự án lên Backend
export const createProjectApi = async (projectData) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
    });
    return response.json();
};