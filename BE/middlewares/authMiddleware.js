const jwt = require('jsonwebtoken');

// Kiểm tra Access Token JWT gửi lên từ Client
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Tách chuỗi 'Bearer <token>'

    if (!token) {
        return res.status(401).json({ success: false, message: "Quyền truy cập bị từ chối. Vui lòng đăng nhập!" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Lưu thông tin id và role vào request để xử lý ở bước sau
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