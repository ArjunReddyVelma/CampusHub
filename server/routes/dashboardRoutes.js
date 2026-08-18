const express = require('express');
const {
  getStudentDashboard,
  getProfessorDashboard,
  getClubDashboard
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/student', protect, authorize('student'), getStudentDashboard);
router.get('/professor', protect, authorize('professor'), getProfessorDashboard);
router.get('/club', protect, authorize('club_admin'), getClubDashboard);

module.exports = router;
