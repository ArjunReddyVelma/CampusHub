const express = require('express');
const {
  acceptInvitation,
  rejectInvitation,
  getMyInvitations
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('student'));

router.route('/').get(getMyInvitations);
router.post('/:id/accept', acceptInvitation);
router.post('/:id/reject', rejectInvitation);

module.exports = router;
