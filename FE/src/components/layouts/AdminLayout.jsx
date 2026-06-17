import { Outlet, Link } from 'react-router-dom';

const AdminLayout = () => (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside style={{ width: '250px', background: '#001529', color: 'white', padding: '20px' }}>
            <h2>ADMIN PANEL</h2>
            <nav>
                <Link to="/admin/dashboard" style={{ color: 'white', display: 'block' }}>Dashboard</Link>
                <Link to="/login" onClick={() => localStorage.clear()} style={{ color: 'red' }}>Đăng xuất</Link>
            </nav>
        </aside>
        <main style={{ flex: 1, padding: '20px' }}>
            <Outlet />
        </main>
    </div>
);
export default AdminLayout;