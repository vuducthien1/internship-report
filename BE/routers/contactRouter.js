const express = require('express');
const controller = require('../controllers/publicController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(verifyToken, authorizeRoles('admin'));
router.get('/', controller.getContactRequests);
router.patch('/:id', controller.updateContactStatus);

module.exports = router;
