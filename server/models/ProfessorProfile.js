const mongoose = require('mongoose');

const ProfessorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    department: {
      type: String,
      required: [true, 'Please add a department'],
      trim: true
    },
    officeLocation: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ProfessorProfile', ProfessorProfileSchema);
