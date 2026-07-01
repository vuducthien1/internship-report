const express = require('express');
const controller = require('../controllers/awsController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { uploadTranscribeAudio, validateTranscribeAudio } = require('../middlewares/transcribeUpload');

const router = express.Router();
router.get('/status', verifyToken, authorizeRoles('admin', 'manager', 'engineer'), controller.getStatus);
router.get('/health', verifyToken, authorizeRoles('admin'), controller.checkHealth);
router.post('/transcribe', verifyToken, authorizeRoles('engineer'), uploadTranscribeAudio, validateTranscribeAudio, controller.transcribeAudio);
module.exports = router;
