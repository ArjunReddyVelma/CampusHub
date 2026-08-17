const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['mcq', 'true_false', 'multiple_correct'],
      required: [true, 'Please add a question type']
    },
    text: {
      type: String,
      required: [true, 'Please add the question text'],
      trim: true
    },
    options: {
      type: [String],
      default: []
    },
    correctAnswers: {
      type: [Number], // Indices of correct options (0-indexed)
      required: [true, 'Please add the correct answer indices'],
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: 'At least one correct answer must be specified'
      }
    },
    marks: {
      type: Number,
      default: 1,
      min: [1, 'Marks must be at least 1']
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to populate options for true_false questions automatically
QuestionSchema.pre('save', function (next) {
  if (this.type === 'true_false') {
    this.options = ['True', 'False'];
    const invalid = this.correctAnswers.some(ans => ans !== 0 && ans !== 1);
    if (invalid) {
      return next(new Error('Correct answers for true/false questions must be 0 (True) or 1 (False)'));
    }
  }
  next();
});

module.exports = mongoose.model('Question', QuestionSchema);
