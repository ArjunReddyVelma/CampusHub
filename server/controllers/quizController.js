const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const ROLES = require('../constants/roles');

// @desc    Create a new quiz
// @route   POST /api/v1/quizzes
// @access  Private (Professor)
const createQuiz = async (req, res, next) => {
  try {
    const {
      title,
      description,
      duration,
      startTime,
      endTime,
      totalMarks,
      passingMarks,
      attemptsAllowed,
      negativeMarking,
      negativeMarkPercent,
      randomizeQuestions,
      randomizeOptions,
      showResultsImmediately,
      showCorrectAnswers
    } = req.body;

    const quiz = await Quiz.create({
      professor: req.user.id,
      title,
      description,
      duration,
      startTime,
      endTime,
      totalMarks,
      passingMarks,
      attemptsAllowed,
      negativeMarking,
      negativeMarkPercent,
      randomizeQuestions,
      randomizeOptions,
      showResultsImmediately,
      showCorrectAnswers
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: { quiz }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all quizzes with role-based filtering
// @route   GET /api/v1/quizzes
// @access  Private (Student, Professor, Admin)
const getQuizzes = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === ROLES.PROFESSOR) {
      query.professor = req.user.id;
    } else if (req.user.role === ROLES.STUDENT) {
      query.isPublished = true;
    }

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const quizzes = await Quiz.find(query).populate('professor', 'name email');

    res.status(200).json({
      success: true,
      message: 'Quizzes retrieved successfully',
      data: { quizzes }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single quiz details
// @route   GET /api/v1/quizzes/:id
// @access  Private
const getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('professor', 'name email');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (req.user.role === ROLES.STUDENT && !quiz.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this quiz'
      });
    }

    let questionsQuery = Question.find({ quiz: quiz._id });

    // DTO Exclusion: Hide correct answers for students before submission
    if (req.user.role === ROLES.STUDENT) {
      questionsQuery = questionsQuery.select('-correctAnswers');
    }

    const questions = await questionsQuery;

    res.status(200).json({
      success: true,
      message: 'Quiz details retrieved successfully',
      data: {
        quiz,
        questions
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a quiz configuration
// @route   PATCH /api/v1/quizzes/:id
// @access  Private (Professor)
const updateQuiz = async (req, res, next) => {
  try {
    let quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (quiz.professor.toString() !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this quiz'
      });
    }

    quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Quiz configuration updated successfully',
      data: { quiz }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a quiz
// @route   DELETE /api/v1/quizzes/:id
// @access  Private (Professor)
const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (quiz.professor.toString() !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this quiz'
      });
    }

    await Question.deleteMany({ quiz: quiz._id });
    await Quiz.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Quiz and associated questions deleted successfully',
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz
};
