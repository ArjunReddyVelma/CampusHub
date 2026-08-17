const express = require('express');
const {
  submitAttempt,
  getAttempt
} = require('../controllers/attemptController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/:id').get(protect, getAttempt);
router.route('/:id/submit').post(protect, submitAttempt);

module.exports = router;
