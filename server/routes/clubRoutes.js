const express = require('express');
const {
  createClub,
  getClubs,
  getClub,
  updateClub,
  deleteClub,
  moderateClubStatus,
  getMyClub
} = require('../controllers/clubController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Middleware to optionally set req.user if a token is present, without throwing 401 on missing.
// Useful for public routes that have customized visibility if logged in as Admin/Owner.
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
  .post(protect, authorize('club_admin', 'admin'), createClub)
  .get(optionalProtect, getClubs);

router.get('/my-club', protect, authorize('club_admin'), getMyClub);

router
  .route('/:id')
  .get(optionalProtect, getClub)
  .patch(protect, authorize('club_admin', 'admin'), updateClub)
  .delete(protect, authorize('club_admin', 'admin'), deleteClub);

router
  .route('/:id/status')
  .patch(protect, authorize('admin'), moderateClubStatus);

module.exports = router;
