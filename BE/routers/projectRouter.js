const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, projectController.getAllProjects);
router.get('/:id/workspace', verifyToken, authorizeRoles('admin', 'manager'), projectController.getProjectWorkspace);
router.get('/:id', verifyToken, projectController.getProjectById);

router.post(
    '/',
    verifyToken,
    authorizeRoles('admin', 'manager'),
    projectController.createProject
);

router.put(
    '/:id',
    verifyToken,
    authorizeRoles('admin', 'manager'),
    projectController.updateProject
);

router.delete(
    '/:id',
    verifyToken,
    authorizeRoles('admin'),
    projectController.deleteProject
);

module.exports = router;
