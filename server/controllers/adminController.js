const mongoose = require('mongoose');
const User = require('../models/User');
const Club = require('../models/Club');
const Hackathon = require('../models/Hackathon');
const Quiz = require('../models/Quiz');
const ROLES = require('../constants/roles');
const StudentProfile = require('../models/StudentProfile');
const ProfessorProfile = require('../models/ProfessorProfile');

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

// @desc    Create a new university user
// @route   POST /api/v1/admin/users
// @access  Private (Admin Only)
const createUser = async (req, res, next) => {
  const { name, email, password, role, universityId, employeeId, department, year, officeLocation } = req.body;

  try {
    // Validate role
    if (!role || !Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Validate email format
    if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,6})+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please add a valid email'
      });
    }

    // Validate university domain if configured
    if (process.env.UNIVERSITY_EMAIL_DOMAIN && (role === ROLES.STUDENT || role === ROLES.PROFESSOR)) {
      const domain = process.env.UNIVERSITY_EMAIL_DOMAIN.trim().toLowerCase();
      if (domain.length > 0) {
        const emailParts = email.toLowerCase().split('@');
        if (emailParts.length !== 2 || emailParts[1] !== domain) {
          return res.status(400).json({
            success: false,
            message: `Email must belong to the domain ${domain}`
          });
        }
      }
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
      if (employeeId) {
        const empIdExists = await User.findOne({ employeeId });
        if (empIdExists) {
          return res.status(400).json({
            success: false,
            message: 'Faculty/Employee ID is already registered'
          });
        }
      }
    }

    // Create User
    const user = await User.create({
      name,
      email,
      password,
      role,
      mustChangePassword: true,
      accountSource: 'institution',
      passwordState: 'Temporary Password',
      universityId: role === ROLES.STUDENT ? universityId : undefined,
      employeeId: role === ROLES.PROFESSOR ? employeeId : undefined
    });

    try {
      // Create corresponding Profile
      if (role === ROLES.STUDENT) {
        await StudentProfile.create({
          user: user._id,
          universityId,
          department,
          year
        });
      } else if (role === ROLES.PROFESSOR) {
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

    res.status(201).json({
      success: true,
      message: 'User account provisioned successfully',
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

// @desc    Import users from CSV
// @route   POST /api/v1/admin/users/import
// @access  Private (Admin Only)
const importUsers = async (req, res, next) => {
  try {
    const csvText = req.body.csv || req.body;
    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide CSV data as text' });
    }

    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length <= 1) {
      return res.status(400).json({ success: false, message: 'CSV is empty or missing header/rows' });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push({ rowIndex: i + 1, data: row });
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const seenEmails = new Set();
    const seenUniversityIds = new Set();
    const seenEmployeeIds = new Set();
    const validatedRows = [];

    for (const { rowIndex, data } of rows) {
      const { name, email, role, universityid, employeeid, department, year } = data;

      if (!name || !email || !role) {
        errors.push(`Row ${rowIndex}: Missing required fields (name, email, role)`);
        continue;
      }

      if (!Object.values(ROLES).includes(role)) {
        errors.push(`Row ${rowIndex}: Invalid role '${role}'`);
        continue;
      }

      if (seenEmails.has(email.toLowerCase())) {
        errors.push(`Row ${rowIndex}: Duplicate email '${email}' in CSV`);
        continue;
      }
      seenEmails.add(email.toLowerCase());

      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,6})+$/.test(email)) {
        errors.push(`Row ${rowIndex}: Invalid email format '${email}'`);
        continue;
      }

      if (process.env.UNIVERSITY_EMAIL_DOMAIN && (role === ROLES.STUDENT || role === ROLES.PROFESSOR)) {
        const domain = process.env.UNIVERSITY_EMAIL_DOMAIN.trim().toLowerCase();
        if (!email.toLowerCase().endsWith(`@${domain}`)) {
          errors.push(`Row ${rowIndex}: Email must belong to the domain ${domain}`);
          continue;
        }
      }

      const emailExists = await User.findOne({ email });
      if (emailExists) {
        errors.push(`Row ${rowIndex}: Email '${email}' is already registered in system`);
        continue;
      }

      if (role === ROLES.STUDENT) {
        if (!universityid || !department || !year) {
          errors.push(`Row ${rowIndex}: Student requires universityId, department, and year`);
          continue;
        }
        if (seenUniversityIds.has(universityid)) {
          errors.push(`Row ${rowIndex}: Duplicate universityId '${universityid}' in CSV`);
          continue;
        }
        seenUniversityIds.add(universityid);

        const uIdExists = await StudentProfile.findOne({ universityId: universityid });
        if (uIdExists) {
          errors.push(`Row ${rowIndex}: University ID '${universityid}' is already registered`);
          continue;
        }
      } else if (role === ROLES.PROFESSOR) {
        if (!department) {
          errors.push(`Row ${rowIndex}: Professor requires department`);
          continue;
        }
        if (employeeid) {
          if (seenEmployeeIds.has(employeeid)) {
            errors.push(`Row ${rowIndex}: Duplicate employeeId '${employeeid}' in CSV`);
            continue;
          }
          seenEmployeeIds.add(employeeid);

          const empIdExists = await User.findOne({ employeeId: employeeid });
          if (empIdExists) {
            errors.push(`Row ${rowIndex}: Faculty/Employee ID '${employeeid}' is already registered`);
            continue;
          }
        }
      }

      validatedRows.push({
        name,
        email,
        role,
        universityId: universityid,
        employeeId: employeeid,
        department,
        year: year ? parseInt(year) : undefined
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    let session = null;
    let useTransaction = true;
    let transactionFailedWithReplicaSet = false;

    const createdUsers = [];

    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        for (const row of validatedRows) {
          const tempPassword = 'TemporaryPassword123!';
          const [user] = await User.create([{
            name: row.name,
            email: row.email,
            password: tempPassword,
            role: row.role,
            mustChangePassword: true,
            accountSource: 'institution',
            passwordState: 'Temporary Password',
            universityId: row.universityId,
            employeeId: row.employeeId
          }], { session });

          if (row.role === ROLES.STUDENT) {
            await StudentProfile.create([{
              user: user._id,
              universityId: row.universityId,
              department: row.department,
              year: row.year
            }], { session });
          } else if (row.role === ROLES.PROFESSOR) {
            await ProfessorProfile.create([{
              user: user._id,
              department: row.department,
              officeLocation: ''
            }], { session });
          }
          createdUsers.push(user);
        }
      });
    } catch (txErr) {
      if (txErr.message && txErr.message.includes('Transaction numbers are only allowed')) {
        transactionFailedWithReplicaSet = true;
        useTransaction = false;
        createdUsers.length = 0; // Reset array for clean fallback
      } else {
        throw txErr;
      }
    } finally {
      if (session) {
        await session.endSession();
      }
    }

    if (transactionFailedWithReplicaSet || !useTransaction) {
      // Standalone node manual rollback fallback
      try {
        for (const row of validatedRows) {
          const tempPassword = 'TemporaryPassword123!';
          const user = await User.create({
            name: row.name,
            email: row.email,
            password: tempPassword,
            role: row.role,
            mustChangePassword: true,
            accountSource: 'institution',
            passwordState: 'Temporary Password',
            universityId: row.universityId,
            employeeId: row.employeeId
          });
          createdUsers.push(user);

          if (row.role === ROLES.STUDENT) {
            await StudentProfile.create({
              user: user._id,
              universityId: row.universityId,
              department: row.department,
              year: row.year
            });
          } else if (row.role === ROLES.PROFESSOR) {
            await ProfessorProfile.create({
              user: user._id,
              department: row.department,
              officeLocation: ''
            });
          }
        }
      } catch (batchErr) {
        // Rollback created users
        for (const user of createdUsers) {
          await User.findByIdAndDelete(user._id);
          await StudentProfile.deleteOne({ user: user._id });
          await ProfessorProfile.deleteOne({ user: user._id });
        }
        throw batchErr;
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported ${createdUsers.length} users`,
      data: { count: createdUsers.length }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset user's password (Admin Only)
// @route   POST /api/v1/admin/users/:id/reset-password
// @access  Private (Admin Only)
const resetUserPassword = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate temporary password
    const tempPassword = 'Temp' + Math.random().toString(36).substring(2, 10) + '!';

    targetUser.password = tempPassword;
    targetUser.mustChangePassword = true;
    targetUser.passwordState = 'Password Reset Required';
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. User must change this temporary password at next login.',
      data: {
        tempPassword
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminDashboard,
  getUsers,
  updateUserRole,
  toggleUserStatus,
  createUser,
  importUsers,
  resetUserPassword
};
