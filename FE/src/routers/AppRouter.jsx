// FE/src/routers/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'; // [ĐÃ SỬA] Thêm Outlet vào đây
import GuestLayout from '../components/layouts/GuestLayout';
import AdminLayout from '../components/layouts/AdminLayout';
import Login from '../pages/guest/Login';
import Register from '../pages/guest/Register';

// Component trang giả định để test
const AdminDashboard = () => <h2>Chào mừng Admin tới trang Quản trị</h2>;
const EngineerTasks = () => <h2>Chào mừng Kỹ sư tới trang Công việc</h2>;

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Luồng cho khách (Chưa đăng nhập) */}
                <Route element={<GuestLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} /> {/* [MỚI] Thêm dòng này */}
                    <Route path="/" element={<Navigate to="/login" />} />
                </Route>

                {/* Luồng cho Admin */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                </Route>

                {/* Luồng cho Engineer (Tạm thời dùng chung Layout đơn giản) */}
                <Route path="/engineer" element={<div style={{padding: 20}}><Outlet /></div>}>
                    <Route path="tasks" element={<EngineerTasks />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
export default AppRouter;