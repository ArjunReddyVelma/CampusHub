const express = require('express');
const {
  updateQuestion,
  deleteQuestion
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/:id')
  .patch(protect, authorize('professor', 'admin'), updateQuestion)
  .delete(protect, authorize('professor', 'admin'), deleteQuestion);

module.exports = router;
