const express = require('express');
const controller = require('../controllers/incidentController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { uploadIncidentImage, validateIncidentImage } = require('../middlewares/operationUploads');

const router = express.Router();
router.get('/', verifyToken, authorizeRoles('admin', 'manager', 'engineer'), controller.getIncidents);
router.post('/', verifyToken, authorizeRoles('engineer'), uploadIncidentImage, validateIncidentImage, controller.createIncident);
router.post('/:id/resolution-evidence', verifyToken, authorizeRoles('admin', 'manager'), uploadIncidentImage, validateIncidentImage, controller.uploadResolutionEvidence);
router.patch('/:id/status', verifyToken, authorizeRoles('admin', 'manager'), controller.updateIncidentStatus);

module.exports = router;
