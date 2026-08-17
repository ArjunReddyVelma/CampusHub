const express = require('express');
const {
  getStudentDashboard,
  getProfessorDashboard
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/student', protect, authorize('student'), getStudentDashboard);
router.get('/professor', protect, authorize('professor'), getProfessorDashboard);

module.exports = router;
