const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { uploadReportAttachment, validateReportAttachment } = require('../middlewares/reportUpload');

router.get(
    '/',
    verifyToken,
    authorizeRoles('admin', 'manager', 'engineer'),
    reportController.getAllReports
);

router.post(
    '/',
    verifyToken,
    authorizeRoles('engineer'),
    uploadReportAttachment,
    validateReportAttachment,
    reportController.createReport
);

router.patch(
    '/:id/review',
    verifyToken,
    authorizeRoles('admin', 'manager'),
    reportController.reviewReport
);

module.exports = router;
