const Club = require('../models/Club');
const Hackathon = require('../models/Hackathon');
const ROLES = require('../constants/roles');

// @desc    Create a new club
// @route   POST /api/v1/clubs
// @access  Private (Club Admin, Admin)
const createClub = async (req, res, next) => {
  try {
    const { name, description, logo, category, socialLinks, contactInfo, facultyCoordinator } = req.body;

    const existingClub = await Club.findOne({ owner: req.user.id });
    if (existingClub) {
      return res.status(400).json({
        success: false,
        message: 'You already own a club. One club per administrator allowed.'
      });
    }

    const club = await Club.create({
      name,
      description,
      logo,
      category,
      socialLinks,
      contactInfo,
      facultyCoordinator,
      owner: req.user.id,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Club registration request submitted successfully and is pending approval',
      data: { club }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all clubs
// @route   GET /api/v1/clubs
// @access  Public
const getClubs = async (req, res, next) => {
  try {
    let query = { status: 'approved' };

    if (req.user && req.user.role === ROLES.ADMIN) {
      query = {};
    }

    const clubs = await Club.find(query).populate('owner', 'name email');

    res.status(200).json({
      success: true,
      message: 'Clubs retrieved successfully',
      data: { clubs }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single club details
// @route   GET /api/v1/clubs/:id
// @access  Public
const getClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id).populate('owner', 'name email');

    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const isAdmin = req.user && req.user.role === ROLES.ADMIN;
    const isOwner = req.user && club.owner._id.toString() === req.user.id;

    if (club.status !== 'approved' && !isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'This club is pending approval or has been suspended'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Club details retrieved successfully',
      data: { club }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a club profile
// @route   PATCH /api/v1/clubs/:id
// @access  Private (Club Admin, Admin)
const updateClub = async (req, res, next) => {
  try {
    let club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    if (club.owner.toString() !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this club' });
    }

    const { owner, status, ...updateData } = req.body;

    club = await Club.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Club profile updated successfully',
      data: { club }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a club
// @route   DELETE /api/v1/clubs/:id
// @access  Private (Club Admin, Admin)
const deleteClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    if (club.owner.toString() !== req.user.id && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this club' });
    }

    await Hackathon.deleteMany({ club: club._id });
    await Club.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Club and all associated hackathons deleted successfully',
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Moderate club status (Approve, Reject, Suspend)
// @route   PATCH /api/v1/clubs/:id/status
// @access  Private (Admin Only)
const moderateClubStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['approved', 'pending', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid status' });
    }

    const club = await Club.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    res.status(200).json({
      success: true,
      message: `Club status updated to ${status} successfully`,
      data: { club }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createClub,
  getClubs,
  getClub,
  updateClub,
  deleteClub,
  moderateClubStatus
};
