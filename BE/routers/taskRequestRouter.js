const express = require('express');
const controller = require('../controllers/taskRequestController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();
router.get('/', verifyToken, authorizeRoles('admin', 'manager', 'engineer'), controller.getRequests);
router.post('/', verifyToken, authorizeRoles('engineer'), controller.createRequest);
router.patch('/:id/review', verifyToken, authorizeRoles('admin', 'manager'), controller.reviewRequest);

module.exports = router;
