const Submission = require('../models/Submission');
const Hackathon = require('../models/Hackathon');
const Team = require('../models/Team');
const ROLES = require('../constants/roles');

// @desc    Create/Overwrite project submission
// @route   POST /api/v1/hackathons/:hackathonId/submissions
// @access  Private (Student in complete team)
const submitProject = async (req, res, next) => {
  try {
    const hackathon = await Hackathon.findById(req.params.hackathonId);
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    if (!hackathon.isPublished) {
      return res.status(403).json({ success: false, message: 'This hackathon is not active' });
    }

    const now = new Date();
    if (now < hackathon.startDate || now > hackathon.submissionDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Submission window is closed or has not opened yet'
      });
    }

    const team = await Team.findOne({
      hackathon: hackathon._id,
      members: req.user.id
    });

    if (!team) {
      return res.status(400).json({
        success: false,
        message: 'You are not registered in any team for this hackathon'
      });
    }

    if (team.members.length < hackathon.minTeamSize) {
      return res.status(400).json({
        success: false,
        message: `Your team does not meet the minimum size requirement of ${hackathon.minTeamSize} member(s)`
      });
    }

    const { repositoryUrl, demoVideoUrl, description } = req.body;
    if (!repositoryUrl || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide repositoryUrl and description'
      });
    }

    let submission = await Submission.findOne({ team: team._id });
    if (submission) {
      submission.repositoryUrl = repositoryUrl;
      submission.demoVideoUrl = demoVideoUrl;
      submission.description = description;
      submission.submittedBy = req.user.id;
      await submission.save();
      
      return res.status(200).json({
        success: true,
        message: 'Project submission updated successfully',
        data: { submission }
      });
    }

    submission = await Submission.create({
      hackathon: hackathon._id,
      team: team._id,
      submittedBy: req.user.id,
      repositoryUrl,
      demoVideoUrl,
      description
    });

    team.status = 'submitted';
    await team.save();

    res.status(201).json({
      success: true,
      message: 'Project submitted successfully',
      data: { submission }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Evaluate a project submission
// @route   POST /api/v1/submissions/:id/evaluate
// @access  Private (Judge, Admin)
const evaluateProject = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const hackathon = await Hackathon.findById(submission.hackathon);
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Associated hackathon not found' });
    }

    const isJudge = hackathon.judges.includes(req.user.id);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isJudge && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned as a judge for this hackathon'
      });
    }

    const { criteriaScores, feedback } = req.body;
    if (!criteriaScores || !Array.isArray(criteriaScores)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide criteria scores array'
      });
    }

    const totalScore = criteriaScores.reduce((acc, curr) => acc + (curr.score || 0), 0);

    const existingEvalIndex = submission.evaluations.findIndex(
      evalItem => evalItem.judge.toString() === req.user.id
    );

    const evaluationObj = {
      judge: req.user.id,
      criteriaScores,
      feedback,
      totalScore,
      evaluatedAt: new Date()
    };

    if (existingEvalIndex >= 0) {
      submission.evaluations[existingEvalIndex] = evaluationObj;
    } else {
      submission.evaluations.push(evaluationObj);
    }

    const sum = submission.evaluations.reduce((acc, curr) => acc + curr.totalScore, 0);
    submission.finalScore = sum / submission.evaluations.length;
    submission.status = 'evaluated';

    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Evaluation submitted successfully',
      data: { submission }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's team submission for a hackathon
// @route   GET /api/v1/hackathons/:hackathonId/submissions/my-submission
// @access  Private (Student)
const getMySubmission = async (req, res, next) => {
  try {
    const team = await Team.findOne({
      hackathon: req.params.hackathonId,
      members: req.user.id
    });

    if (!team) {
      return res.status(200).json({
        success: true,
        data: { submission: null }
      });
    }

    const submission = await Submission.findOne({ team: team._id })
      .populate('submittedBy', 'name email')
      .populate({
        path: 'evaluations.judge',
        select: 'name email'
      });

    res.status(200).json({
      success: true,
      message: 'Submission retrieved successfully',
      data: { submission }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitProject,
  evaluateProject,
  getMySubmission
};
