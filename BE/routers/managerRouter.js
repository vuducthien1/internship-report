const express = require('express');
const controller = require('../controllers/managerController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();
router.get('/dashboard', verifyToken, authorizeRoles('manager'), controller.getDashboard);
router.get('/kpis', verifyToken, authorizeRoles('manager'), controller.getKpis);

module.exports = router;
