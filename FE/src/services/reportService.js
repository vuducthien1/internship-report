const API_URL = "http://localhost:5000/api/reports";

export const createReportApi = async (reportData) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reportData)
    });
    return response.json();
};