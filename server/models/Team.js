const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please add a team name'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    status: {
      type: String,
      enum: ['forming', 'complete', 'submitted', 'disqualified'],
      default: 'forming'
    }
  },
  {
    timestamps: true
  }
);

// Compound index to guarantee team name uniqueness within a specific hackathon
TeamSchema.index({ hackathon: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Team', TeamSchema);
