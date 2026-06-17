import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerApi } from '../../services/authService';
import './Login.css'; // Dùng chung CSS cho đồng bộ

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        fullname: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: '',
        role: 'engineer' // Luôn mặc định là engineer khi đăng ký qua web
    });
    
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ text: '⏳ Đang xử lý...', type: 'info' });

        // Cấu trúc data gửi xuống giống hệt lúc bạn test bằng Thunder Client
        const data = await registerApi(formData);

        if (data.success) {
            setMessage({ text: '✅ ' + data.message + ' Đang chuyển hướng...', type: 'success' });
            // Tự động chuyển về trang đăng nhập sau 2 giây
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            setMessage({ text: '❌ ' + data.message, type: 'error' });
        }
        setIsLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>ĐĂNG KÝ TÀI KHOẢN</h2>
                <form onSubmit={handleRegister}>
                    <input type="text" name="username" placeholder="Tên đăng nhập (VD: phuocbui)" required onChange={handleChange} />
                    <input type="text" name="fullname" placeholder="Họ và tên (VD: Bùi Thanh Phước)" required onChange={handleChange} />
                    <input type="email" name="email" placeholder="Email" required onChange={handleChange} />
                    <input type="text" name="phone" placeholder="Số điện thoại (10 số)" required onChange={handleChange} />
                    <input type="password" name="password" placeholder="Mật khẩu" required onChange={handleChange} />
                    <input type="password" name="confirm_password" placeholder="Nhập lại mật khẩu" required onChange={handleChange} />
                    
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Đang tạo...' : 'Đăng Ký'}
                    </button>
                </form>
                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}
                <div style={{ marginTop: '15px', fontSize: '14px' }}>
                    Đã có tài khoản? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Đăng nhập ngay</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;