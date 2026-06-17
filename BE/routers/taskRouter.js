const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Chỉ Admin và Manager mới được gọi API Giao việc (POST)
router.post('/', verifyToken, authorizeRoles('admin', 'manager'), taskController.createTask);

// Chỉ Kỹ sư mới được gọi API Xem việc của mình (GET)
router.get('/my-tasks', verifyToken, authorizeRoles('engineer'), taskController.getMyTasks);

module.exports = router;