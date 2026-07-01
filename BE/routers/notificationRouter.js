const express = require('express');
const controller = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();
router.get('/', verifyToken, controller.getNotifications);
router.patch('/read-all', verifyToken, controller.markAllAsRead);
router.patch('/:id/read', verifyToken, controller.markAsRead);

module.exports = router;
