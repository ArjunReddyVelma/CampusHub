const express = require('express');
const {
  createQuiz,
  getQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz
} = require('../controllers/quizController');
const { addQuestion } = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .post(protect, authorize('professor', 'admin'), createQuiz)
  .get(protect, getQuizzes);

router
  .route('/:id')
  .get(protect, getQuiz)
  .patch(protect, authorize('professor', 'admin'), updateQuiz)
  .delete(protect, authorize('professor', 'admin'), deleteQuiz);

router
  .route('/:quizId/questions')
  .post(protect, authorize('professor', 'admin'), addQuestion);

module.exports = router;
