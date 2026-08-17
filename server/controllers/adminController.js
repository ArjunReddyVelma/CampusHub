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

module.exports = {
  getAdminDashboard
};
