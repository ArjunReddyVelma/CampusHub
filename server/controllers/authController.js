const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const ProfessorProfile = require('../models/ProfessorProfile');
const { sendTokenResponse } = require('../utils/token');
const ROLES = require('../constants/roles');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
  const { name, email, password, role, universityId, department, year, officeLocation } = req.body;

  try {
    // Validate role is public
    if (role && ![ROLES.STUDENT, ROLES.PROFESSOR].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role for public registration'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already registered with this email'
      });
    }

    // If role is student, validate student fields
    if (role === ROLES.STUDENT) {
      if (!universityId || !department || !year) {
        return res.status(400).json({
          success: false,
          message: 'Please provide universityId, department, and year'
        });
      }
      const uIdExists = await StudentProfile.findOne({ universityId });
      if (uIdExists) {
        return res.status(400).json({
          success: false,
          message: 'University ID is already registered'
        });
      }
    }

    // If role is professor, validate professor fields
    if (role === ROLES.PROFESSOR) {
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Please provide department'
        });
      }
    }

    // Create User
    const user = await User.create({
      name,
      email,
      password,
      role: role || ROLES.STUDENT
    });

    try {
      // Create corresponding Profile
      if (user.role === ROLES.STUDENT) {
        await StudentProfile.create({
          user: user._id,
          universityId,
          department,
          year
        });
      } else if (user.role === ROLES.PROFESSOR) {
        await ProfessorProfile.create({
          user: user._id,
          department,
          officeLocation: officeLocation || ''
        });
      }
    } catch (profileError) {
      // Rollback user creation if profile creation fails
      await User.findByIdAndDelete(user._id);
      throw profileError;
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      message: 'User data retrieved',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change Password
// @route   PATCH /api/v1/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide currentPassword and newPassword'
      });
    }

    // Get user with password select
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect current password'
      });
    }

    // Set new password (will be hashed in pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  changePassword
};
