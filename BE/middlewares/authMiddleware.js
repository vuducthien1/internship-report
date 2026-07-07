const resolveAuthUser = require('../utils/resolveAuthUser');
const { extractAccessToken } = require('../utils/authSession');

// Kiểm tra Access Token JWT gửi lên từ Client
exports.verifyToken = async (req, res, next) => {
    const token = extractAccessToken(req);

    if (!token) {
        return res.status(401).json({ success: false, message: "Quyền truy cập bị từ chối. Vui lòng đăng nhập!" });
    }

    try {
        const user = await resolveAuthUser(token);
        if (!user || user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản không còn hoạt động. Vui lòng liên hệ quản trị viên.',
            });
        }

        // Luôn dùng role hiện tại trong DB thay vì role cũ được nhúng trong JWT.
        req.user = { id: user.id, role: user.role, auth_version: Number(user.auth_version) || 0 };
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Phiên làm việc hết hạn hoặc token không hợp lệ!" });
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
