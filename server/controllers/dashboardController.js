const Quiz = require('../models/Quiz');
const StudentProfile = require('../models/StudentProfile');

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

module.exports = {
  getStudentDashboard,
  getProfessorDashboard
};
