const express = require('express');
const controller = require('../controllers/documentController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { uploadProjectDocument, validateProjectDocument } = require('../middlewares/operationUploads');

const router = express.Router();
router.get('/', verifyToken, authorizeRoles('admin', 'manager', 'engineer'), controller.getDocuments);
router.post('/', verifyToken, authorizeRoles('admin', 'manager'), uploadProjectDocument, validateProjectDocument, controller.uploadDocument);
router.get('/:id/download', verifyToken, authorizeRoles('admin', 'manager', 'engineer'), controller.downloadDocument);

module.exports = router;
