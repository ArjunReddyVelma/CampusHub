const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const ROLES = require('../constants/roles');

// @desc    Add question to quiz
// @route   POST /api/v1/quizzes/:quizId/questions
// @access  Private (Professor)
const addQuestion = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (quiz.professor.toString() !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this quiz'
      });
    }

    const { type, text, options, correctAnswers, marks } = req.body;

    const question = await Question.create({
      quiz: req.params.quizId,
      type,
      text,
      options,
      correctAnswers,
      marks
    });

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      data: { question }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a question
// @route   PATCH /api/v1/questions/:id
// @access  Private (Professor)
const updateQuestion = async (req, res, next) => {
  try {
    let question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const quiz = await Quiz.findById(question.quiz);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Parent quiz not found'
      });
    }

    if (quiz.professor.toString() !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this question'
      });
    }

    question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: { question }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a question
// @route   DELETE /api/v1/questions/:id
// @access  Private (Professor)
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const quiz = await Quiz.findById(question.quiz);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Parent quiz not found for this question'
      });
    }

    if (quiz.professor.toString() !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this question'
      });
    }

    await Question.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addQuestion,
  updateQuestion,
  deleteQuestion
};
