const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const ROLES = require('../constants/roles');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ],
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Ensures password is not returned in queries by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT
    },
    isActive: {
      type: Boolean,
      default: true
    },
    mustChangePassword: {
      type: Boolean,
      default: false
    },
    accountSource: {
      type: String,
      enum: ['institution', 'system'],
      default: 'institution'
    },
    universityId: {
      type: String,
      sparse: true,
      index: true
    },
    employeeId: {
      type: String,
      sparse: true,
      index: true
    },
    emailVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
