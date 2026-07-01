const express = require('express');
const controller = require('../controllers/userDeletionController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/candidates', verifyToken, authorizeRoles('manager'), controller.getManagerCandidates);
router.get('/requests', verifyToken, authorizeRoles('admin', 'manager'), controller.getRequests);
router.post('/requests', verifyToken, authorizeRoles('manager'), controller.requestDeletion);
router.patch('/requests/:id/review', verifyToken, authorizeRoles('admin'), controller.reviewRequest);
router.post('/direct', verifyToken, authorizeRoles('admin'), controller.directDelete);
router.get('/deleted', verifyToken, authorizeRoles('admin'), controller.getDeletedUsers);
router.patch('/deleted/:id/restore', verifyToken, authorizeRoles('admin'), controller.restoreUser);

module.exports = router;
