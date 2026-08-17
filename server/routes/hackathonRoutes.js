const express = require('express');
const {
  createHackathon,
  getHackathons,
  getHackathon,
  updateHackathon,
  deleteHackathon
} = require('../controllers/hackathonController');
const { createTeam } = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const optionalProtect = async (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    next();
  }
};

router
  .route('/')
  .post(protect, authorize('club_admin', 'admin'), createHackathon)
  .get(optionalProtect, getHackathons);

router
  .route('/:id')
  .get(optionalProtect, getHackathon)
  .patch(protect, authorize('club_admin', 'admin'), updateHackathon)
  .delete(protect, authorize('club_admin', 'admin'), deleteHackathon);

router
  .route('/:hackathonId/teams')
  .post(protect, authorize('student'), createTeam);

module.exports = router;
