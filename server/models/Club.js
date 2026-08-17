const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a club name'],
      unique: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Please add a description']
    },
    logo: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      trim: true
    },
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      website: { type: String, default: '' }
    },
    contactInfo: {
      type: String,
      default: ''
    },
    facultyCoordinator: {
      type: String,
      default: ''
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // One club admin can own at most one club
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Club', ClubSchema);
