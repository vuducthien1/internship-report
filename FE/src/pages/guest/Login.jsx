// FE/src/pages/guest/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // [ĐÃ SỬA] Thêm chữ Link vào đây
import { loginApi } from '../../services/authService';
import './Login.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const data = await loginApi(username, password);

        if (data.success) {
            localStorage.setItem('accessToken', data.token);
            localStorage.setItem('role', data.user.role);
            
            if (data.user.role === 'admin') navigate('/admin/dashboard');
            else if (data.user.role === 'manager') navigate('/manager/projects'); // Thêm luồng cho manager
            else if (data.user.role === 'engineer') navigate('/engineer/tasks');
            else navigate('/');
        } else {
            setMessage(data.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>HỆ THỐNG CÔNG TRƯỜNG</h2>
                <form onSubmit={handleLogin}>
                    <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} />
                    <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
                    <button type="submit">Đăng Nhập</button>
                </form>
                {message && <p style={{ color: 'red', fontWeight: 'bold' }}>{message}</p>}

                <div style={{ marginTop: '15px', fontSize: '14px' }}>
                    Chưa có tài khoản? <Link to="/register" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>Đăng ký ngay</Link>
                </div>
                
            </div>
        </div>
    );
}
export default Login;