const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Kiểm tra Access Token JWT gửi lên từ Client
exports.verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Tách chuỗi 'Bearer <token>'

    if (!token) {
        return res.status(401).json({ success: false, message: "Quyền truy cập bị từ chối. Vui lòng đăng nhập!" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await db.query(
            `SELECT id, role, status
             FROM users
             WHERE id = ? AND deleted_at IS NULL
             LIMIT 1`,
            [decoded.id]
        );

        if (!users.length || users[0].status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản không còn hoạt động. Vui lòng liên hệ quản trị viên.',
            });
        }

        // Luôn dùng role hiện tại trong DB thay vì role cũ được nhúng trong JWT.
        req.user = { id: users[0].id, role: users[0].role };
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Phiên làm việc hết hạn hoặc token không hợp lệ!" });
    }
};

// Chặn người dùng dựa trên danh sách quyền hạn (Role)
exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: "Bạn không đủ thẩm quyền thực hiện hành động này!" 
            });
        }
        next();
    };
};
