const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const ROLES = require('../constants/roles');

// Helper to evaluate and save an attempt
const evaluateAttempt = async (attempt, quiz, answersSubmitted) => {
  const questions = await Question.find({ quiz: quiz._id });
  let totalScore = 0;

  const answerMap = new Map();
  if (answersSubmitted && Array.isArray(answersSubmitted)) {
    answersSubmitted.forEach(ans => {
      answerMap.set(ans.question.toString(), ans.selectedAnswers || []);
    });
  }

  const finalAnswersList = [];

  for (const q of questions) {
    const studentSelections = answerMap.get(q._id.toString()) || [];
    finalAnswersList.push({
      question: q._id,
      selectedAnswers: studentSelections
    });

    const correctSels = q.correctAnswers || [];
    
    const studentSorted = [...studentSelections].sort((a, b) => a - b);
    const correctSorted = [...correctSels].sort((a, b) => a - b);

    let isCorrect = false;
    if (studentSorted.length === correctSorted.length) {
      isCorrect = studentSorted.every((val, index) => val === correctSorted[index]);
    }

    if (isCorrect) {
      totalScore += q.marks;
    } else {
      if (quiz.negativeMarking && studentSelections.length > 0) {
        const penalty = q.marks * (quiz.negativeMarkPercent / 100);
        totalScore -= penalty;
      }
    }
  }

  attempt.score = Math.max(0, totalScore);
  attempt.isPassed = attempt.score >= quiz.passingMarks;
  attempt.answers = finalAnswersList;
  attempt.submittedAt = new Date();
};

// @desc    Start/Resume a quiz attempt
// @route   POST /api/v1/quizzes/:quizId/attempts
// @access  Private (Student)
const startAttempt = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    if (!quiz.isPublished) {
      return res.status(403).json({ success: false, message: 'This quiz is not available yet' });
    }

    const now = new Date();
    if (now < quiz.startTime || now > quiz.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Quiz session is closed or has not started yet'
      });
    }

    const previousAttempts = await QuizAttempt.find({
      student: req.user.id,
      quiz: quiz._id
    });

    const activeAttempt = previousAttempts.find(att => att.status === 'in_progress');
    if (activeAttempt) {
      const elapsedMs = now.getTime() - activeAttempt.startedAt.getTime();
      const limitMs = quiz.duration * 60 * 1000;
      
      if (elapsedMs > limitMs + 15000) {
        activeAttempt.status = 'expired';
        await evaluateAttempt(activeAttempt, quiz, activeAttempt.answers);
        await activeAttempt.save();
        
        const updatedAttempts = await QuizAttempt.find({
          student: req.user.id,
          quiz: quiz._id
        });
        
        if (updatedAttempts.length >= quiz.attemptsAllowed) {
          return res.status(400).json({
            success: false,
            message: 'You have reached the maximum number of attempts for this quiz'
          });
        }
      } else {
        return res.status(200).json({
          success: true,
          message: 'Resuming active quiz attempt',
          data: { attempt: activeAttempt }
        });
      }
    } else {
      if (previousAttempts.length >= quiz.attemptsAllowed) {
        return res.status(400).json({
          success: false,
          message: 'You have reached the maximum number of attempts for this quiz'
        });
      }
    }

    const attempt = await QuizAttempt.create({
      student: req.user.id,
      quiz: quiz._id,
      status: 'in_progress',
      startedAt: now
    });

    res.status(201).json({
      success: true,
      message: 'Quiz attempt started successfully',
      data: { attempt }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit a quiz attempt
// @route   POST /api/v1/attempts/:id/submit
// @access  Private (Student)
const submitAttempt = async (req, res, next) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    if (attempt.student.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to submit this attempt' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Attempt cannot be submitted. Current status: ${attempt.status}`
      });
    }

    const quiz = await Quiz.findById(attempt.quiz);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Associated quiz not found' });
    }

    const now = new Date();
    const elapsedMs = now.getTime() - attempt.startedAt.getTime();
    const limitMs = quiz.duration * 60 * 1000;

    if (elapsedMs > limitMs + 30000) {
      attempt.status = 'expired';
    } else {
      attempt.status = 'submitted';
    }

    const { answers } = req.body;
    await evaluateAttempt(attempt, quiz, answers);
    await attempt.save();

    if (!quiz.showResultsImmediately) {
      return res.status(200).json({
        success: true,
        message: 'Quiz attempt submitted successfully. Results will be published later.',
        data: {
          attempt: {
            _id: attempt._id,
            status: attempt.status,
            submittedAt: attempt.submittedAt
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quiz attempt submitted and evaluated successfully',
      data: { attempt }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single attempt details
// @route   GET /api/v1/attempts/:id
// @access  Private
const getAttempt = async (req, res, next) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id)
      .populate('quiz')
      .populate('student', 'name email');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    const isOwner = attempt.student._id.toString() === req.user.id;
    const isProf = attempt.quiz.professor.toString() === req.user.id;
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isOwner && !isProf && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this attempt' });
    }

    if (isOwner && !attempt.quiz.showResultsImmediately && attempt.status !== 'in_progress') {
      return res.status(200).json({
        success: true,
        message: 'Attempt retrieved. Score details are hidden until published.',
        data: {
          attempt: {
            _id: attempt._id,
            student: attempt.student,
            quiz: {
              _id: attempt.quiz._id,
              title: attempt.quiz.title,
              duration: attempt.quiz.duration,
              totalMarks: attempt.quiz.totalMarks
            },
            status: attempt.status,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attempt details retrieved successfully',
      data: { attempt }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user attempts
// @route   GET /api/v1/attempts
// @access  Private (Student)
const getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({ student: req.user.id }).populate('quiz');
    res.status(200).json({
      success: true,
      message: 'Attempts retrieved successfully',
      data: { attempts }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all attempts for a quiz (Professor only)
// @route   GET /api/v1/quizzes/:quizId/attempts
// @access  Private (Professor or Admin)
const getQuizAttempts = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    if (quiz.professor.toString() !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Not authorized to view results for this quiz' });
    }

    const attempts = await QuizAttempt.find({ quiz: req.params.quizId })
      .populate('student', 'name email')
      .sort('-submittedAt');

    res.status(200).json({
      success: true,
      message: 'Quiz attempts retrieved successfully',
      data: { attempts }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startAttempt,
  submitAttempt,
  getAttempt,
  getMyAttempts,
  getQuizAttempts
};
