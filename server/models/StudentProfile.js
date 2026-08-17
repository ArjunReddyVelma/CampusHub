const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    universityId: {
      type: String,
      required: [true, 'Please add a university ID'],
      unique: true,
      trim: true,
      index: true
    },
    department: {
      type: String,
      required: [true, 'Please add a department'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Please add your study year'],
      min: [1, 'Study year must be at least 1'],
      max: [5, 'Study year cannot exceed 5']
    },
    skills: {
      type: [String],
      default: []
    },
    bio: {
      type: String,
      default: ''
    },
    profilePhoto: {
      type: String,
      default: ''
    },
    githubUrl: {
      type: String,
      default: ''
    },
    linkedinUrl: {
      type: String,
      default: ''
    },
    xp: {
      type: Number,
      default: 0
    },
    points: {
      type: Number,
      default: 0
    },
    badges: {
      type: [String],
      default: []
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);
