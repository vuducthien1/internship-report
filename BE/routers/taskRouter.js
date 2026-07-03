const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, authorizeRoles('admin', 'manager'), taskController.getTasks);

// Chỉ Admin và Manager mới được gọi API Giao việc (POST)
router.post('/', verifyToken, authorizeRoles('admin', 'manager'), taskController.createTask);
router.put('/:id', verifyToken, authorizeRoles('admin', 'manager'), taskController.updateTask);

// Chỉ Kỹ sư mới được gọi API Xem việc của mình (GET)
router.get('/my-tasks', verifyToken, authorizeRoles('engineer'), taskController.getMyTasks);
router.get('/engineer-dashboard', verifyToken, authorizeRoles('engineer'), taskController.getEngineerDashboard);

router.get('/:id/details', verifyToken, authorizeRoles('admin', 'manager', 'engineer'), taskController.getTaskDetails);
router.post('/:id/updates', verifyToken, authorizeRoles('engineer'), taskController.addTaskUpdate);

router.get('/:id/checklist', verifyToken, authorizeRoles('admin', 'manager', 'engineer'), taskController.getTaskChecklist);
router.patch('/:id/checklist', verifyToken, authorizeRoles('engineer'), taskController.updateTaskChecklist);
router.patch('/:id/checklist/:itemId', verifyToken, authorizeRoles('engineer'), taskController.updateChecklistItem);

module.exports = router;
