const Hackathon = require('../models/Hackathon');
const Club = require('../models/Club');
const ROLES = require('../constants/roles');

// @desc    Create a new hackathon
// @route   POST /api/v1/hackathons
// @access  Private (Club Admin)
const createHackathon = async (req, res, next) => {
  try {
    const club = await Club.findOne({ owner: req.user.id });
    if (!club) {
      return res.status(400).json({
        success: false,
        message: 'You must register a club before creating a hackathon'
      });
    }

    if (club.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: `Only approved clubs can organize hackathons. Current club status: ${club.status}`
      });
    }

    const {
      title,
      description,
      banner,
      problemStatement,
      rules,
      eligibility,
      skillsRequired,
      startDate,
      endDate,
      registrationDeadline,
      submissionDeadline,
      locationType,
      location,
      minTeamSize,
      maxTeamSize,
      prizes,
      sponsors,
      judges
    } = req.body;

    const hackathon = await Hackathon.create({
      club: club._id,
      title,
      description,
      banner,
      problemStatement,
      rules,
      eligibility,
      skillsRequired,
      startDate,
      endDate,
      registrationDeadline,
      submissionDeadline,
      locationType,
      location,
      minTeamSize,
      maxTeamSize,
      prizes,
      sponsors,
      judges
    });

    res.status(201).json({
      success: true,
      message: 'Hackathon created successfully (draft mode)',
      data: { hackathon }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all hackathons
// @route   GET /api/v1/hackathons
// @access  Public
const getHackathons = async (req, res, next) => {
  try {
    let query = { isPublished: true };

    if (req.user) {
      if (req.user.role === ROLES.ADMIN) {
        query = {};
      } else if (req.user.role === ROLES.CLUB_ADMIN) {
        const club = await Club.findOne({ owner: req.user.id });
        if (club) {
          query = {
            $or: [
              { club: club._id },
              { isPublished: true }
            ]
          };
        }
      } else if (req.user.role === ROLES.JUDGE) {
        query = { isPublished: true, judges: req.user.id };
      }
    }

    if (req.query.club) {
      if (req.user && req.user.role === ROLES.CLUB_ADMIN) {
        const club = await Club.findOne({ owner: req.user.id });
        if (club && club._id.toString() === req.query.club) {
          query = { club: club._id };
        } else {
          query = { club: req.query.club, isPublished: true };
        }
      } else if (req.user && req.user.role === ROLES.ADMIN) {
        query = { club: req.query.club };
      } else if (req.user && req.user.role === ROLES.JUDGE) {
        query = { club: req.query.club, isPublished: true, judges: req.user.id };
      } else {
        query = { club: req.query.club, isPublished: true };
      }
    }

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const hackathons = await Hackathon.find(query).populate('club', 'name logo');

    res.status(200).json({
      success: true,
      message: 'Hackathons retrieved successfully',
      data: { hackathons }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single hackathon details
// @route   GET /api/v1/hackathons/:id
// @access  Public
const getHackathon = async (req, res, next) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id)
      .populate('club', 'name logo description owner')
      .populate('judges', 'name email');

    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    const isAdmin = req.user && req.user.role === ROLES.ADMIN;
    const isOwner = req.user && hackathon.club.owner.toString() === req.user.id;

    if (!hackathon.isPublished && !isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'This hackathon is currently in draft mode and is not public yet'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hackathon details retrieved successfully',
      data: { hackathon }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update hackathon details
// @route   PATCH /api/v1/hackathons/:id
// @access  Private (Club Admin, Admin)
const updateHackathon = async (req, res, next) => {
  try {
    let hackathon = await Hackathon.findById(req.params.id).populate('club');
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    if (hackathon.club.owner.toString() !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this hackathon' });
    }

    hackathon = await Hackathon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Hackathon updated successfully',
      data: { hackathon }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete hackathon
// @route   DELETE /api/v1/hackathons/:id
// @access  Private (Club Admin, Admin)
const deleteHackathon = async (req, res, next) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id).populate('club');
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    if (hackathon.club.owner.toString() !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this hackathon' });
    }

    await Hackathon.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Hackathon deleted successfully',
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createHackathon,
  getHackathons,
  getHackathon,
  updateHackathon,
  deleteHackathon
};
