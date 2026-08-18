require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const ProfessorProfile = require('../models/ProfessorProfile');

const seedRealisticData = async () => {
  try {
    // 1. Refuse execution in production mode
    if (process.env.NODE_ENV === 'production') {
      console.error('Error: Seeding realistic mock data is refused in production mode.');
      process.exit(1);
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI is not defined.');
      process.exit(1);
    }

    // 2. Connect DB
    await mongoose.connect(mongoUri);
    console.log('Database connected successfully for realistic seeding.');

    const seedPassword = process.env.SEED_PASSWORD || 'TemporaryPassword123!';

    // Define seed lists
    const adminAccount = {
      name: 'CampusHub Administrator',
      email: 'admin@campushub.test',
      password: seedPassword,
      role: 'admin',
      mustChangePassword: false,
      accountSource: 'system',
      isActive: true
    };

    const professors = [
      { name: 'Dr. Sharma', email: 'prof.sharma@campushub.test', employeeId: 'PROF_SHARMA', department: 'Computer Science' },
      { name: 'Dr. Jones', email: 'prof.jones@campushub.test', employeeId: 'PROF_JONES', department: 'Mathematics' },
      { name: 'Dr. Taylor', email: 'prof.taylor@campushub.test', employeeId: 'PROF_TAYLOR', department: 'Physics' }
    ];

    const students = Array.from({ length: 10 }, (_, i) => {
      const pad = String(i + 1).padStart(3, '0');
      return {
        name: `Student ${pad}`,
        email: `student${pad}@campushub.test`,
        universityId: `SPSU_SEED_${pad}`,
        department: i % 2 === 0 ? 'Computer Science' : 'Software Engineering',
        year: (i % 4) + 1
      };
    });

    const clubAdmin = {
      name: 'Tech Club President',
      email: 'clubadmin@campushub.test',
      role: 'club_admin'
    };

    const judges = [
      { name: 'Chief Judge 1', email: 'judge1@campushub.test', role: 'judge' },
      { name: 'Chief Judge 2', email: 'judge2@campushub.test', role: 'judge' }
    ];

    // Seeding tracking stats
    const stats = { created: 0, existed: 0, failed: 0 };

    const processUser = async (userData, profileData = null) => {
      try {
        const exists = await User.findOne({ email: userData.email.toLowerCase() });
        if (exists) {
          if (process.env.RESET_SEED_ACCOUNTS === 'true' && process.env.NODE_ENV !== 'production') {
            exists.password = userData.password || seedPassword;
            exists.mustChangePassword = userData.mustChangePassword !== undefined ? userData.mustChangePassword : true;
            exists.isActive = true;
            await exists.save();
            stats.created++;
            return;
          }
          stats.existed++;
          return;
        }

        const user = await User.create({
          name: userData.name,
          email: userData.email,
          password: userData.password || seedPassword,
          role: userData.role,
          mustChangePassword: userData.mustChangePassword !== undefined ? userData.mustChangePassword : true,
          accountSource: userData.accountSource || 'institution',
          universityId: userData.universityId,
          employeeId: userData.employeeId,
          isActive: true
        });

        if (profileData) {
          if (userData.role === 'student') {
            await StudentProfile.create({
              user: user._id,
              universityId: profileData.universityId,
              department: profileData.department,
              year: profileData.year
            });
          } else if (userData.role === 'professor') {
            await ProfessorProfile.create({
              user: user._id,
              department: profileData.department,
              officeLocation: 'Block A, Faculty Room'
            });
          }
        }
        stats.created++;
      } catch (err) {
        console.error(`Failed to seed user ${userData.email}: ${err.message}`);
        stats.failed++;
      }
    };

    // 1. Seed Admin
    await processUser(adminAccount);

    // 2. Seed Professors
    for (const prof of professors) {
      await processUser(
        {
          name: prof.name,
          email: prof.email,
          role: 'professor',
          employeeId: prof.employeeId
        },
        { department: prof.department }
      );
    }

    // 3. Seed Students
    for (const stud of students) {
      await processUser(
        {
          name: stud.name,
          email: stud.email,
          role: 'student',
          universityId: stud.universityId
        },
        {
          universityId: stud.universityId,
          department: stud.department,
          year: stud.year
        }
      );
    }

    // 4. Seed Club Admin
    await processUser(clubAdmin);

    // 5. Seed Judges
    for (const judge of judges) {
      await processUser(judge);
    }

    console.log('\n--- Seeding Complete ---');
    console.log(`Created: ${stats.created} accounts`);
    console.log(`Already Existed: ${stats.existed} accounts`);
    console.log(`Failed: ${stats.failed} accounts`);

    await mongoose.disconnect();
    console.log('Database disconnected cleanly.');
    process.exit(0);
  } catch (err) {
    console.error(`Fatal seeding error: ${err.message}`);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
};

seedRealisticData();
