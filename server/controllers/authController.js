const crypto = require('crypto');
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
    if (process.env.ALLOW_PUBLIC_REGISTRATION !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Public registration is disabled. Please contact your university administrator.'
      });
    }

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

    const authProvider = require('../utils/authProvider');
    const result = await authProvider.authenticate(email, password);

    if (!result.success) {
      const statusCode = result.isSuspended ? 403 : 401;
      return res.status(statusCode).json({
        success: false,
        message: result.message
      });
    }

    sendTokenResponse(result.user, 200, res);
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
    user.mustChangePassword = false;
    user.passwordState = 'Active';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          mustChangePassword: user.mustChangePassword
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update student/professor profile
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    let profile;
    if (req.user.role === 'student') {
      const { bio, githubUrl, linkedinUrl, skills } = req.body;
      profile = await StudentProfile.findOneAndUpdate(
        { user: req.user.id },
        { bio, githubUrl, linkedinUrl, skills },
        { new: true, runValidators: true }
      );
    } else if (req.user.role === 'professor') {
      const ProfessorProfile = require('../models/ProfessorProfile');
      const { officeLocation } = req.body;
      profile = await ProfessorProfile.findOneAndUpdate(
        { user: req.user.id },
        { officeLocation },
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with that email' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and save to user db
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes expiration

    await user.save();

    // Log the link in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] Password reset link: http://localhost:5173/reset-password/${resetToken}`);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link generated and logged successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset Password
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  try {
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Please provide token and new password' });
    }

    // Hash token to compare
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    // Set new password (will be hashed in pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.mustChangePassword = false;
    user.passwordState = 'Active';

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
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
  changePassword,
  updateProfile,
  forgotPassword,
  resetPassword
};
