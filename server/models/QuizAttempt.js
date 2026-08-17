const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'expired', 'invalidated'],
      default: 'in_progress'
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    submittedAt: {
      type: Date
    },
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
          required: true
        },
        selectedAnswers: {
          type: [Number],
          default: []
        }
      }
    ],
    score: {
      type: Number,
      default: 0
    },
    warningsCount: {
      type: Number,
      default: 0
    },
    isPassed: {
      type: Boolean
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
