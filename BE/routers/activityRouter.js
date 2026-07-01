const express = require('express');
const controller = require('../controllers/activityController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();
router.get('/', verifyToken, authorizeRoles('admin'), controller.getActivityLogs);

module.exports = router;
