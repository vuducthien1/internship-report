import { useState, useEffect } from 'react';
import { getProjectsApi, createProjectApi } from '../../services/projectService';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    
    // [MỚI] Biến dùng để kích hoạt tải lại bảng dữ liệu
    const [refreshKey, setRefreshKey] = useState(0); 
    
    const [formData, setFormData] = useState({
        name: '', description: '', location: '', manager_id: '', start_date: '', end_date: ''
    });

    // Đưa toàn bộ logic gọi API vào thẳng trong useEffect để ESLint không soi nữa
    useEffect(() => {
        const fetchProjects = async () => {
            const data = await getProjectsApi();
            if (data.success) {
                setProjects(data.data);
            } else {
                setError(data.message);
            }
        };
        
        fetchProjects();
    }, [refreshKey]); // [MỚI] Mỗi khi refreshKey thay đổi số, useEffect sẽ tự động chạy lại hàm bên trong!

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = await createProjectApi(formData);
        
        if (data.success) {
            alert('✅ Tạo dự án thành công!');
            setShowModal(false); 
            
            // [MỚI] Đổi số để kích hoạt useEffect tự fetch lại data
            setRefreshKey(oldKey => oldKey + 1); 
            
            setFormData({ name: '', description: '', location: '', manager_id: '', start_date: '', end_date: '' }); 
        } else {
            alert('❌ Lỗi: ' + data.message);
        }
    };

    return (
        <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ marginTop: 0, color: '#333' }}>🏗️ Danh Sách Dự Án Đang Triển Khai</h2>
                <button 
                    onClick={() => setShowModal(true)}
                    style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Thêm Dự Án Mới
                </button>
            </div>
            
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#001529', color: 'white', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>Tên Dự Án</th>
                        <th style={{ padding: '12px' }}>Địa Điểm</th>
                        <th style={{ padding: '12px' }}>Quản Lý</th>
                        <th style={{ padding: '12px' }}>Trạng Thái</th>
                        <th style={{ padding: '12px' }}>Ngày Bắt Đầu</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.length > 0 ? (
                        projects.map(proj => (
                            <tr key={proj.id} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{proj.name}</td>
                                <td style={{ padding: '12px' }}>{proj.location}</td>
                                <td style={{ padding: '12px' }}>👨‍💼 {proj.manager_name}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ 
                                        padding: '5px 10px', borderRadius: '20px', 
                                        backgroundColor: proj.status === 'planning' ? '#ffc107' : '#28a745',
                                        color: '#000', fontSize: '12px', fontWeight: 'bold'
                                    }}>
                                        {proj.status === 'planning' ? 'Đang lên kế hoạch' : proj.status}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>{new Date(proj.start_date).toLocaleDateString('vi-VN')}</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Chưa có dự án nào!</td></tr>
                    )}
                </tbody>
            </table>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '10px', width: '400px' }}>
                        <h3 style={{ marginTop: 0 }}>Tạo Dự Án Mới</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" name="name" value={formData.name} placeholder="Tên dự án" required onChange={handleChange} style={{ padding: '10px' }} />
                            <input type="text" name="description" value={formData.description} placeholder="Mô tả" onChange={handleChange} style={{ padding: '10px' }} />
                            <input type="text" name="location" value={formData.location} placeholder="Địa điểm" required onChange={handleChange} style={{ padding: '10px' }} />
                            <input type="number" name="manager_id" value={formData.manager_id} placeholder="ID của Quản lý (VD: 2)" required onChange={handleChange} style={{ padding: '10px' }} />
                            
                            <label style={{ fontSize: '14px', marginBottom: '-10px' }}>Ngày bắt đầu:</label>
                            <input type="date" name="start_date" value={formData.start_date} required onChange={handleChange} style={{ padding: '10px' }} />
                            
                            <label style={{ fontSize: '14px', marginBottom: '-10px' }}>Ngày kết thúc:</label>
                            <input type="date" name="end_date" value={formData.end_date} required onChange={handleChange} style={{ padding: '10px' }} />
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" style={{ flex: 1, padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Lưu Dự Án</button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Hủy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;