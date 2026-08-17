const express = require('express');
const {
  inviteMember,
  leaveTeam,
  removeMember
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('student'));

router.post('/:teamId/invite', inviteMember);
router.post('/:teamId/leave', leaveTeam);
router.post('/:teamId/members/:memberId/remove', removeMember);

module.exports = router;
