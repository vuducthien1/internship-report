const express = require('express');
const controller = require('../controllers/managerAssignmentController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, authorizeRoles('admin', 'manager'), controller.getAssignments);
router.post('/', verifyToken, authorizeRoles('admin'), controller.createAssignment);
router.patch('/:id/progress', verifyToken, authorizeRoles('manager'), controller.updateProgress);
router.patch('/:id/cancel', verifyToken, authorizeRoles('admin'), controller.cancelAssignment);

module.exports = router;
