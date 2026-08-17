const express = require('express');
const {
  acceptInvitation,
  rejectInvitation
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('student'));

router.post('/:id/accept', acceptInvitation);
router.post('/:id/reject', rejectInvitation);

module.exports = router;
