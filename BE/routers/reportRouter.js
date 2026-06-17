const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Chỉ Kỹ sư mới được gửi báo cáo
router.post('/', verifyToken, authorizeRoles('engineer'), reportController.createReport);

module.exports = router;