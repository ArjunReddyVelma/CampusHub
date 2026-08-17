const mongoose = require('mongoose');

const TeamInvitationSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true
    },
    inviter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    invitee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate pending invitations to the same person from the same team
TeamInvitationSchema.index({ team: 1, invitee: 1, status: 1 });

module.exports = mongoose.model('TeamInvitation', TeamInvitationSchema);
