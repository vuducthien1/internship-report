import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTasksApi } from '../../services/taskService';
import { createReportApi } from '../../services/reportService'; 

function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0); 
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [reportData, setReportData] = useState({ content: '', status: 'in_progress' });

    // [ĐÃ SỬA] Đưa thẳng logic gọi API vào trong useEffect
    useEffect(() => {
        const fetchMyTasks = async () => {
            const data = await getMyTasksApi();
            if (data.success) {
                setTasks(data.data);
            } else {
                setError(data.message);
            }
        };
        
        fetchMyTasks();
    }, [refreshKey]); // Chỉ phụ thuộc vào biến refreshKey

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const openReportModal = (task) => {
        setSelectedTask(task);
        setReportData({ content: '', status: task.status === 'pending' ? 'in_progress' : task.status });
        setShowModal(true);
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        const data = await createReportApi({
            task_id: selectedTask.id,
            content: reportData.content,
            status: reportData.status
        });

        if (data.success) {
            alert('✅ Báo cáo thành công!');
            setShowModal(false);
            setRefreshKey(old => old + 1); // Cập nhật lại UI ngay lập tức
        } else {
            alert('❌ Lỗi: ' + data.message);
        }
    };

    return (
        <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#007bff', padding: '15px 20px', borderRadius: '10px', color: 'white', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: 0 }}>👷 Ký Sự Công Trường</h3>
                <button onClick={handleLogout} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Đăng xuất
                </button>
            </div>

            <h2 style={{ color: '#333', marginBottom: '20px' }}>📋 Danh sách công việc của tôi</h2>
            
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Lỗi: {error}</p>}

            {/* Container Thẻ Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <div key={task.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: task.status === 'completed' ? '5px solid #28a745' : '5px solid #007bff' }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>
                                DỰ ÁN: {task.project_name.toUpperCase()}
                            </div>
                            <h3 style={{ margin: '0 0 10px 0', color: '#222' }}>{task.title}</h3>
                            <p style={{ color: '#555', fontSize: '14px', marginBottom: '15px' }}>{task.description}</p>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ 
                                    padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                                    backgroundColor: task.status === 'pending' ? '#ffc107' : (task.status === 'in_progress' ? '#17a2b8' : '#28a745'),
                                    color: task.status === 'pending' ? '#000' : '#fff'
                                }}>
                                    {task.status === 'pending' ? '⏳ Chờ xử lý' : (task.status === 'in_progress' ? '🏃 Đang làm' : '✅ Hoàn thành')}
                                </span>
                                
                                {/* Ẩn nút báo cáo nếu công việc đã hoàn thành */}
                                {task.status !== 'completed' && (
                                    <button 
                                        onClick={() => openReportModal(task)}
                                        style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        Báo cáo 🎤
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '10px', gridColumn: '1 / -1' }}>
                        <h3 style={{ color: '#666' }}>🎉 Bạn hiện chưa có công việc nào!</h3>
                    </div>
                )}
            </div>

            {/* --- KHU VỰC POPUP BÁO CÁO --- */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '10px', width: '90%', maxWidth: '400px' }}>
                        <h3 style={{ marginTop: 0, color: '#333' }}>Báo cáo: {selectedTask?.title}</h3>
                        <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            
                            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Nội dung công việc hôm nay:</label>
                            <textarea 
                                required 
                                rows="4" 
                                value={reportData.content}
                                placeholder="Nhập chi tiết khối lượng công việc..."
                                onChange={(e) => setReportData({...reportData, content: e.target.value})}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', resize: 'vertical' }} 
                            />

                            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Cập nhật trạng thái:</label>
                            <select 
                                value={reportData.status} 
                                onChange={(e) => setReportData({...reportData, status: e.target.value})}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                            >
                                <option value="in_progress">🏃 Vẫn đang tiến hành</option>
                                <option value="completed">✅ Đã hoàn thành xong</option>
                            </select>
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" style={{ flex: 1, padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Gửi Báo Cáo</button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyTasks;