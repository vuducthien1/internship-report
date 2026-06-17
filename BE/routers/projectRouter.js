const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Route Lấy danh sách: Ai đã đăng nhập (có Token hợp lệ) đều xem được
router.get('/', verifyToken, projectController.getAllProjects);

// Route Tạo dự án: Phải có Token hợp lệ VÀ Role phải là 'admin' hoặc 'manager'
router.post(
    '/', 
    verifyToken, 
    authorizeRoles('admin', 'manager'), 
    projectController.createProject
);

module.exports = router;