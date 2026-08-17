const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema(
  {
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please add a quiz title'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    duration: {
      type: Number,
      required: [true, 'Please add quiz duration in minutes'],
      min: [1, 'Duration must be at least 1 minute']
    },
    startTime: {
      type: Date,
      required: [true, 'Please add quiz start time']
    },
    endTime: {
      type: Date,
      required: [true, 'Please add quiz end time'],
      validate: {
        validator: function (value) {
          return this.startTime ? value > this.startTime : true;
        },
        message: 'End time must be after start time'
      }
    },
    totalMarks: {
      type: Number,
      required: [true, 'Please add total marks']
    },
    passingMarks: {
      type: Number,
      required: [true, 'Please add passing marks'],
      validate: {
        validator: function (value) {
          return this.totalMarks ? value <= this.totalMarks : true;
        },
        message: 'Passing marks cannot exceed total marks'
      }
    },
    attemptsAllowed: {
      type: Number,
      default: 1,
      min: [1, 'Attempts allowed must be at least 1']
    },
    negativeMarking: {
      type: Boolean,
      default: false
    },
    negativeMarkPercent: {
      type: Number,
      default: 0,
      min: [0, 'Negative mark percent cannot be less than 0'],
      max: [100, 'Negative mark percent cannot exceed 100']
    },
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    randomizeOptions: {
      type: Boolean,
      default: false
    },
    showResultsImmediately: {
      type: Boolean,
      default: true
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true
    },
    isPublished: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Quiz', QuizSchema);
