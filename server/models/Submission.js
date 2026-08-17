const mongoose = require('mongoose');

const CriteriaScoreSchema = new mongoose.Schema({
  criteria: { type: String, required: true },
  score: { type: Number, required: true, min: 0 },
  maxScore: { type: Number, required: true, default: 10 }
});

const EvaluationSchema = new mongoose.Schema({
  judge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  criteriaScores: [CriteriaScoreSchema],
  feedback: { type: String, default: '' },
  totalScore: { type: Number, required: true, default: 0 },
  evaluatedAt: { type: Date, default: Date.now }
});

const SubmissionSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: true,
      index: true
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
      unique: true // A team can make only one submission per hackathon
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    repositoryUrl: {
      type: String,
      required: [true, 'Please add a repository URL'],
      trim: true
    },
    demoVideoUrl: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      required: [true, 'Please add a submission description']
    },
    status: {
      type: String,
      enum: ['submitted', 'evaluated', 'disqualified'],
      default: 'submitted'
    },
    evaluations: [EvaluationSchema],
    finalScore: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Submission', SubmissionSchema);
