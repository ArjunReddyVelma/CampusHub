const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please add an announcement title'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Please add announcement content']
    },
    scope: {
      type: String,
      enum: ['global', 'class', 'club'],
      default: 'global'
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Announcement', AnnouncementSchema);
