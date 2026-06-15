const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Các tuyến đường công khai
router.post('/register', authController.register);
router.post('/login', authController.login);

// Tuyến đường kiểm tra phân quyền: Chỉ cho phép 'admin' hoặc 'manager' đi qua bộ lọc
router.get(
    '/check-role', 
    verifyToken, 
    authorizeRoles('admin', 'manager'), 
    (req, res) => {
        res.status(200).json({ 
            success: true, 
            message: "Xác thực thành công! Bạn có quyền truy cập vào phân hệ quản trị." 
        });
    }
);

module.exports = router;