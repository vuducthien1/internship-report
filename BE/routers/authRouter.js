const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    next();
});

// Các tuyến đường công khai
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshSession);
router.post('/logout', authController.logout);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', verifyToken, authController.me);

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
