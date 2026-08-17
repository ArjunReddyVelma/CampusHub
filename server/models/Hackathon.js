const mongoose = require('mongoose');

const PrizeSchema = new mongoose.Schema({
  rank: { type: Number, required: true },
  reward: { type: String, required: true },
  description: { type: String, default: '' }
});

const SponsorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String, default: '' },
  website: { type: String, default: '' }
});

const HackathonSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please add a description']
    },
    banner: {
      type: String,
      default: ''
    },
    problemStatement: {
      type: String,
      required: [true, 'Please add a problem statement']
    },
    rules: {
      type: String,
      default: ''
    },
    eligibility: {
      type: String,
      default: ''
    },
    skillsRequired: {
      type: [String],
      default: []
    },
    startDate: {
      type: Date,
      required: [true, 'Please add start date']
    },
    endDate: {
      type: Date,
      required: [true, 'Please add end date'],
      validate: {
        validator: function (value) {
          return this.startDate ? value > this.startDate : true;
        },
        message: 'End date must be after start date'
      }
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Please add registration deadline'],
      validate: {
        validator: function (value) {
          return this.startDate ? value < this.startDate : true;
        },
        message: 'Registration deadline must be before start date'
      }
    },
    submissionDeadline: {
      type: Date,
      required: [true, 'Please add submission deadline'],
      validate: {
        validator: function (value) {
          return this.endDate ? value <= this.endDate && value > this.startDate : true;
        },
        message: 'Submission deadline must be between start date and end date'
      }
    },
    locationType: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      default: 'online'
    },
    location: {
      type: String,
      default: 'Online'
    },
    minTeamSize: {
      type: Number,
      default: 1,
      min: [1, 'Minimum team size must be at least 1']
    },
    maxTeamSize: {
      type: Number,
      default: 4,
      min: [1, 'Maximum team size must be at least 1'],
      validate: {
        validator: function (value) {
          return this.minTeamSize ? value >= this.minTeamSize : true;
        },
        message: 'Maximum team size cannot be less than minimum team size'
      }
    },
    prizes: [PrizeSchema],
    sponsors: [SponsorSchema],
    judges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isPublished: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Full-text search index on Hackathon title, description, and problem statement
HackathonSchema.index({ title: 'text', description: 'text', problemStatement: 'text' });

module.exports = mongoose.model('Hackathon', HackathonSchema);
