const express = require('express');
const { getAdminDashboard } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, authorize('admin'), getAdminDashboard);

module.exports = router;
