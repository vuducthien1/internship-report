const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/me', verifyToken, userController.getMyProfile);
router.patch('/me', verifyToken, userController.updateMyProfile);
router.patch('/me/password', verifyToken, userController.changeMyPassword);

router.get(
    '/managers',
    verifyToken,
    authorizeRoles('admin', 'manager'),
    userController.getManagers
);

router.get(
    '/engineers',
    verifyToken,
    authorizeRoles('admin', 'manager'),
    userController.getEngineers
);

router.get(
    '/',
    verifyToken,
    authorizeRoles('admin'),
    userController.getAllUsers
);

router.patch(
    '/:id/profile',
    verifyToken,
    authorizeRoles('admin'),
    userController.adminUpdateUserProfile
);

router.patch(
    '/:id/status',
    verifyToken,
    authorizeRoles('admin'),
    userController.updateUserStatus
);

router.patch(
    '/:id/role',
    verifyToken,
    authorizeRoles('admin'),
    userController.updateUserRole
);

module.exports = router;
