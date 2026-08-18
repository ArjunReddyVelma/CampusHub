const express = require('express');
const {
  submitAttempt,
  getAttempt,
  getMyAttempts
} = require('../controllers/attemptController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/').get(protect, getMyAttempts);
router.route('/:id').get(protect, getAttempt);
router.route('/:id/submit').post(protect, submitAttempt);

module.exports = router;
