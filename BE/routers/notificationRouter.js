const express = require('express');
const controller = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();
router.get('/push/config', verifyToken, controller.getPushConfig);
router.post('/push/subscribe', verifyToken, controller.subscribePush);
router.delete('/push/subscribe', verifyToken, controller.unsubscribePush);
router.get('/', verifyToken, controller.getNotifications);
router.patch('/read-all', verifyToken, controller.markAllAsRead);
router.patch('/:id/read', verifyToken, controller.markAsRead);

module.exports = router;
