const User = require('../models/User');
const Club = require('../models/Club');
const Hackathon = require('../models/Hackathon');
const Quiz = require('../models/Quiz');
const ROLES = require('../constants/roles');

// @desc    Get Admin Dashboard metrics
// @route   GET /api/v1/admin/dashboard
// @access  Private (Admin Only)
const getAdminDashboard = async (req, res, next) => {
  try {
    const users = await User.find({});
    const totalUsers = users.length;
    const studentCount = users.filter(u => u.role === ROLES.STUDENT).length;
    const professorCount = users.filter(u => u.role === ROLES.PROFESSOR).length;
    const clubAdminCount = users.filter(u => u.role === ROLES.CLUB_ADMIN).length;
    const judgeCount = users.filter(u => u.role === ROLES.JUDGE).length;
    const adminCount = users.filter(u => u.role === ROLES.ADMIN).length;

    const clubs = await Club.find({});
    const totalClubs = clubs.length;
    const approvedClubs = clubs.filter(c => c.status === 'approved').length;
    const pendingClubs = clubs.filter(c => c.status === 'pending').length;
    const suspendedClubs = clubs.filter(c => c.status === 'suspended').length;

    const hackathons = await Hackathon.find({});
    const totalHackathons = hackathons.length;
    const publishedHackathons = hackathons.filter(h => h.isPublished).length;
    const draftHackathons = hackathons.filter(h => !h.isPublished).length;

    const quizzesCount = await Quiz.countDocuments({});

    res.status(200).json({
      success: true,
      message: 'Admin dashboard metrics retrieved successfully',
      data: {
        users: {
          total: totalUsers,
          students: studentCount,
          professors: professorCount,
          clubAdmins: clubAdminCount,
          judges: judgeCount,
          admins: adminCount
        },
        clubs: {
          total: totalClubs,
          approved: approvedClubs,
          pending: pendingClubs,
          suspended: suspendedClubs
        },
        hackathons: {
          total: totalHackathons,
          published: publishedHackathons,
          drafts: draftHackathons
        },
        quizzesCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users list
// @route   GET /api/v1/admin/users
// @access  Private (Admin Only)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({
      success: true,
      data: { users }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user role
// @route   PATCH /api/v1/admin/users/:id/role
// @access  Private (Admin Only)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !Object.values(ROLES).includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Admin self-protection: cannot demote self
    if (targetUser._id.toString() === req.user.id.toString() && targetUser.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot remove their own admin role'
      });
    }

    // Last administrator protection
    if (targetUser.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
      const activeAdmins = await User.countDocuments({ role: ROLES.ADMIN, isActive: true });
      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Demoting the last active administrator is not permitted'
        });
      }
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: { user: targetUser }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle user active/suspended status
// @route   PATCH /api/v1/admin/users/:id/status
// @access  Private (Admin Only)
const toggleUserStatus = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Admin self-protection: cannot suspend self
    if (targetUser._id.toString() === req.user.id.toString() && targetUser.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot suspend themselves'
      });
    }

    // Last administrator protection
    if (targetUser.role === ROLES.ADMIN && targetUser.isActive) {
      const activeAdmins = await User.countDocuments({ role: ROLES.ADMIN, isActive: true });
      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Suspending the last active administrator is not permitted'
        });
      }
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User status updated to ${targetUser.isActive ? 'active' : 'suspended'}`,
      data: { user: targetUser }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminDashboard,
  getUsers,
  updateUserRole,
  toggleUserStatus
};
