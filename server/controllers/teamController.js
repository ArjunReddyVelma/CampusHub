const Team = require('../models/Team');
const TeamInvitation = require('../models/TeamInvitation');
const Hackathon = require('../models/Hackathon');
const User = require('../models/User');
const ROLES = require('../constants/roles');

// @desc    Create a team for a hackathon
// @route   POST /api/v1/hackathons/:hackathonId/teams
// @access  Private (Student)
const createTeam = async (req, res, next) => {
  try {
    const hackathon = await Hackathon.findById(req.params.hackathonId);
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    if (!hackathon.isPublished) {
      return res.status(403).json({ success: false, message: 'This hackathon is not open yet' });
    }

    const now = new Date();
    if (now > hackathon.registrationDeadline) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    const existingTeam = await Team.findOne({
      hackathon: hackathon._id,
      members: req.user.id
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered in a team for this hackathon'
      });
    }

    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide a team name' });
    }

    const nameTaken = await Team.findOne({ hackathon: hackathon._id, name });
    if (nameTaken) {
      return res.status(400).json({
        success: false,
        message: 'A team with this name already exists in this hackathon'
      });
    }

    const status = hackathon.maxTeamSize === 1 ? 'complete' : 'forming';

    const team = await Team.create({
      hackathon: hackathon._id,
      name,
      description,
      leader: req.user.id,
      members: [req.user.id],
      status
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: { team }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Invite member to team
// @route   POST /api/v1/teams/:teamId/invite
// @access  Private (Student / Team Leader)
const inviteMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId).populate('hackathon');
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the team leader can invite members' });
    }

    if (team.status !== 'forming') {
      return res.status(400).json({
        success: false,
        message: `Cannot invite members. Team status is currently: ${team.status}`
      });
    }

    if (team.members.length >= team.hackathon.maxTeamSize) {
      return res.status(400).json({ success: false, message: 'Team limit reached' });
    }

    const { inviteeEmail } = req.body;
    if (!inviteeEmail) {
      return res.status(400).json({ success: false, message: 'Please provide an email' });
    }

    const invitee = await User.findOne({ email: inviteeEmail });
    if (!invitee || invitee.role !== ROLES.STUDENT) {
      return res.status(404).json({ success: false, message: 'Invitee student account not found' });
    }

    const inviteeInTeam = await Team.findOne({
      hackathon: team.hackathon._id,
      members: invitee._id
    });

    if (inviteeInTeam) {
      return res.status(400).json({
        success: false,
        message: 'This student is already in a team for this hackathon'
      });
    }

    const pendingInvite = await TeamInvitation.findOne({
      team: team._id,
      invitee: invitee._id,
      status: 'pending'
    });

    if (pendingInvite) {
      return res.status(400).json({
        success: false,
        message: 'An invitation is already pending for this student'
      });
    }

    const invitation = await TeamInvitation.create({
      team: team._id,
      inviter: req.user.id,
      invitee: invitee._id,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: { invitation }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Accept team invitation
// @route   POST /api/v1/team-invitations/:id/accept
// @access  Private (Student)
const acceptInvitation = async (req, res, next) => {
  try {
    const invitation = await TeamInvitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (invitation.invitee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this invitation' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation is already: ${invitation.status}`
      });
    }

    const team = await Team.findById(invitation.team).populate('hackathon');
    if (!team) {
      return res.status(404).json({ success: false, message: 'Associated team not found' });
    }

    if (team.status !== 'forming') {
      return res.status(400).json({
        success: false,
        message: `Team is no longer accepting members. Status: ${team.status}`
      });
    }

    if (team.members.length >= team.hackathon.maxTeamSize) {
      return res.status(400).json({ success: false, message: 'Team is already full' });
    }

    const inviteeInTeam = await Team.findOne({
      hackathon: team.hackathon._id,
      members: req.user.id
    });

    if (inviteeInTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already in a team for this hackathon'
      });
    }

    team.members.push(req.user.id);

    if (team.members.length === team.hackathon.maxTeamSize) {
      team.status = 'complete';
    }

    await team.save();

    invitation.status = 'accepted';
    await invitation.save();

    const hackathonTeams = await Team.find({ hackathon: team.hackathon._id }).select('_id');
    const teamIds = hackathonTeams.map(t => t._id);

    await TeamInvitation.updateMany(
      {
        _id: { $ne: invitation._id },
        invitee: req.user.id,
        team: { $in: teamIds },
        status: 'pending'
      },
      { status: 'rejected' }
    );

    res.status(200).json({
      success: true,
      message: 'Invitation accepted. You joined the team.',
      data: { team }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject team invitation
// @route   POST /api/v1/team-invitations/:id/reject
// @access  Private (Student)
const rejectInvitation = async (req, res, next) => {
  try {
    const invitation = await TeamInvitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (invitation.invitee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this invitation' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation is already: ${invitation.status}`
      });
    }

    invitation.status = 'rejected';
    await invitation.save();

    res.status(200).json({
      success: true,
      message: 'Invitation rejected successfully',
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Leave team
// @route   POST /api/v1/teams/:teamId/leave
// @access  Private (Student)
const leaveTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const isMember = team.members.includes(req.user.id);
    if (!isMember) {
      return res.status(400).json({ success: false, message: 'You are not in this team' });
    }

    if (team.leader.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Team leaders cannot leave. You must delete the team or transfer leadership.'
      });
    }

    team.members = team.members.filter(id => id.toString() !== req.user.id);
    team.status = 'forming';
    await team.save();

    res.status(200).json({
      success: true,
      message: 'You have left the team successfully',
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove team member
// @route   POST /api/v1/teams/:teamId/members/:memberId/remove
// @access  Private (Student / Team Leader)
const removeMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the team leader can remove members' });
    }

    const targetMemberId = req.params.memberId;
    const isMember = team.members.includes(targetMemberId);
    if (!isMember) {
      return res.status(400).json({ success: false, message: 'Student is not a member of this team' });
    }

    if (targetMemberId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot remove yourself. Use team delete.' });
    }

    team.members = team.members.filter(id => id.toString() !== targetMemberId);
    team.status = 'forming';
    await team.save();

    await TeamInvitation.deleteMany({
      team: team._id,
      invitee: targetMemberId,
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      message: 'Team member removed successfully',
      data: { team }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's pending invitations
// @route   GET /api/v1/team-invitations
// @access  Private (Student)
const getMyInvitations = async (req, res, next) => {
  try {
    const invitations = await TeamInvitation.find({
      invitee: req.user.id,
      status: 'pending'
    }).populate({
      path: 'team',
      populate: { path: 'hackathon' }
    }).populate('inviter', 'name email');

    res.status(200).json({
      success: true,
      message: 'Invitations retrieved successfully',
      data: { invitations }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get student's team for a hackathon
// @route   GET /api/v1/teams/my-team
// @access  Private (Student)
const getMyTeam = async (req, res, next) => {
  try {
    const { hackathonId } = req.query;
    if (!hackathonId) {
      return res.status(400).json({ success: false, message: 'Please provide hackathonId' });
    }

    const team = await Team.findOne({
      hackathon: hackathonId,
      members: req.user.id
    }).populate('members', 'name email').populate('leader', 'name email');

    res.status(200).json({
      success: true,
      message: 'Team retrieved successfully',
      data: { team }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTeam,
  inviteMember,
  acceptInvitation,
  rejectInvitation,
  leaveTeam,
  removeMember,
  getMyInvitations,
  getMyTeam
};
