const Announcement = require('../models/Announcement');
const Club = require('../models/Club');
const ROLES = require('../constants/roles');

// @desc    Create a new announcement
// @route   POST /api/v1/announcements
// @access  Private (Professor, Club Admin, Admin)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, scope, targetId } = req.body;

    if (scope === 'club') {
      if (!targetId) {
        return res.status(400).json({ success: false, message: 'Please provide targetId for club scope' });
      }
      const club = await Club.findById(targetId);
      if (!club) {
        return res.status(404).json({ success: false, message: 'Club not found' });
      }
      if (club.owner.toString() !== req.user.id && req.user.role !== ROLES.ADMIN) {
        return res.status(403).json({ success: false, message: 'You do not own this club' });
      }
    }

    const announcement = await Announcement.create({
      sender: req.user.id,
      title,
      content,
      scope,
      targetId
    });

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: { announcement }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all relevant announcements
// @route   GET /api/v1/announcements
// @access  Private
const getAnnouncements = async (req, res, next) => {
  try {
    let query = { scope: 'global' };

    if (req.user.role === ROLES.STUDENT) {
      const clubsJoined = await Club.find({ members: req.user.id }).select('_id');
      const clubIds = clubsJoined.map(c => c._id);
      
      query = {
        $or: [
          { scope: 'global' },
          { scope: 'club', targetId: { $in: clubIds } }
        ]
      };
    } else if (req.user.role === ROLES.CLUB_ADMIN) {
      const clubOwned = await Club.findOne({ owner: req.user.id });
      if (clubOwned) {
        query = {
          $or: [
            { scope: 'global' },
            { scope: 'club', targetId: clubOwned._id }
          ]
        };
      }
    } else if (req.user.role === ROLES.ADMIN) {
      query = {};
    }

    const announcements = await Announcement.find(query)
      .populate('sender', 'name email role')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      message: 'Announcements retrieved successfully',
      data: { announcements }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements
};
