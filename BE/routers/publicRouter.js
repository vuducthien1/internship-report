const express = require('express');
const controller = require('../controllers/publicController');

const router = express.Router();
router.get('/stats', controller.getPublicStats);
router.post('/contact', controller.submitContact);

module.exports = router;
