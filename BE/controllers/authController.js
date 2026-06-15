const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerValidator, loginValidator } = require('../validations/authValidation');

// 1. XỬ LÝ ĐĂNG KÝ
exports.register = async (req, res) => {
    try {
        const { error } = registerValidator(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        // Lấy dữ liệu ra (Bỏ qua confirm_password vì nó đã được Joi xác thực khớp rồi)
        const { username, fullname, email, phone, password, role } = req.body;

        // Kiểm tra xem Username hoặc Email đã bị ai dùng chưa
        const [existingUser] = await db.query(
            'SELECT id FROM users WHERE (email = ? OR username = ?) AND deleted_at IS NULL', 
            [email, username]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: "Username hoặc Email này đã tồn tại trên hệ thống!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userRole = role || 'engineer';

        // Insert vào DB với cột username mới
        await db.query(
            'INSERT INTO users (username, fullname, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [username, fullname, email, phone, hashedPassword, userRole]
        );

        return res.status(201).json({ success: true, message: "Tạo tài khoản thành công!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. XỬ LÝ ĐĂNG NHẬP (Bằng Username)
exports.login = async (req, res) => {
    try {
        const { error } = loginValidator(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        // Đổi email thành username
        const { username, password } = req.body;

        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? AND deleted_at IS NULL', 
            [username]
        );
        
        if (users.length === 0) {
            return res.status(400).json({ success: false, message: "Tên đăng nhập hoặc mật khẩu không chính xác!" });
        }

        const user = users[0];

        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Tên đăng nhập hoặc mật khẩu không chính xác!" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            success: true,
            message: "Đăng nhập thành công!",
            token: token,
            user: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};