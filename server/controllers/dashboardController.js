const Quiz = require('../models/Quiz');
const StudentProfile = require('../models/StudentProfile');
const Club = require('../models/Club');
const Hackathon = require('../models/Hackathon');

// @desc    Get Student Dashboard data
// @route   GET /api/v1/dashboard/student
// @access  Private (Student)
const getStudentDashboard = async (req, res, next) => {
  try {
    const now = new Date();

    const profile = await StudentProfile.findOne({ user: req.user.id });

    const activeQuizzes = await Quiz.find({
      isPublished: true,
      startTime: { $lte: now },
      endTime: { $gte: now }
    }).select('-professor').limit(5);

    const upcomingQuizzes = await Quiz.find({
      isPublished: true,
      startTime: { $gt: now }
    }).select('-professor').limit(5);

    res.status(200).json({
      success: true,
      message: 'Student dashboard retrieved successfully',
      data: {
        profile: profile ? {
          xp: profile.xp,
          points: profile.points,
          badges: profile.badges,
          department: profile.department,
          year: profile.year
        } : null,
        activeQuizzes,
        upcomingQuizzes,
        announcements: [],
        recentResults: []
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Professor Dashboard data
// @route   GET /api/v1/dashboard/professor
// @access  Private (Professor)
const getProfessorDashboard = async (req, res, next) => {
  try {
    const now = new Date();

    const allQuizzes = await Quiz.find({ professor: req.user.id });

    const totalQuizzes = allQuizzes.length;
    const activeQuizzesCount = allQuizzes.filter(q => q.isPublished && q.startTime <= now && q.endTime >= now).length;
    const upcomingQuizzesCount = allQuizzes.filter(q => q.isPublished && q.startTime > now).length;
    const completedQuizzesCount = allQuizzes.filter(q => q.isPublished && q.endTime < now).length;
    const draftQuizzesCount = allQuizzes.filter(q => !q.isPublished).length;

    res.status(200).json({
      success: true,
      message: 'Professor dashboard retrieved successfully',
      data: {
        statistics: {
          totalQuizzes,
          activeQuizzes: activeQuizzesCount,
          upcomingQuizzes: upcomingQuizzesCount,
          completedQuizzes: completedQuizzesCount,
          draftQuizzes: draftQuizzesCount
        },
        quizzes: allQuizzes.slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Club Dashboard data
// @route   GET /api/v1/dashboard/club
// @access  Private (Club Admin)
const getClubDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const club = await Club.findOne({ owner: req.user.id });

    if (!club) {
      return res.status(200).json({
        success: true,
        message: 'No club registered for this administrator yet',
        data: {
          club: null,
          statistics: null,
          hackathons: []
        }
      });
    }

    const allHackathons = await Hackathon.find({ club: club._id });

    const totalHackathons = allHackathons.length;
    const activeHackathonsCount = allHackathons.filter(h => h.isPublished && h.startDate <= now && h.endDate >= now).length;
    const upcomingHackathonsCount = allHackathons.filter(h => h.isPublished && h.startDate > now).length;
    const completedHackathonsCount = allHackathons.filter(h => h.isPublished && h.endDate < now).length;
    const draftHackathonsCount = allHackathons.filter(h => !h.isPublished).length;

    res.status(200).json({
      success: true,
      message: 'Club dashboard retrieved successfully',
      data: {
        club,
        statistics: {
          totalHackathons,
          activeHackathons: activeHackathonsCount,
          upcomingHackathons: upcomingHackathonsCount,
          completedHackathons: completedHackathonsCount,
          draftHackathons: draftHackathonsCount
        },
        hackathons: allHackathons.slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudentDashboard,
  getProfessorDashboard,
  getClubDashboard
};
