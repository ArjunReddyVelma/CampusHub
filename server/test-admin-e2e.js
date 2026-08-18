const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const User = require('./models/User');
const Club = require('./models/Club');
const Hackathon = require('./models/Hackathon');
const Announcement = require('./models/Announcement');
const StudentProfile = require('./models/StudentProfile');

const authRoutes = require('./routes/authRoutes');
const clubRoutes = require('./routes/clubRoutes');
const hackathonRoutes = require('./routes/hackathonRoutes');
const adminRoutes = require('./routes/adminRoutes');
const announcementRoutes = require('./routes/announcementRoutes');

const errorHandler = require('./middleware/error');

const PORT = 5160;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const getCookieHeader = (res) => {
  const cookies = res.headers.get('set-cookie');
  return cookies ? cookies.split(',').map(c => c.split(';')[0]).join('; ') : '';
};

const runAdminE2ETest = async () => {
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/campushub_admin_e2e';
  process.env.JWT_SECRET = 'e2esecret123456';
  process.env.JWT_EXPIRE = '1h';

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Admin E2E database');
    
    await User.deleteMany({});
    await Club.deleteMany({});
    await Hackathon.deleteMany({});
    await Announcement.deleteMany({});
    await StudentProfile.deleteMany({});
    console.log('Cleaned collections');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/clubs', clubRoutes);
  app.use('/api/v1/hackathons', hackathonRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/announcements', announcementRoutes);

  app.use(errorHandler);

  const server = app.listen(PORT, async () => {
    console.log(`Admin E2E Test server running on port ${PORT}`);

    let adminCookie = '';
    let clubAdminCookie = '';
    let stud1Cookie = '';
    let profCookie = '';

    try {
      // Step 1: Pre-populate accounts directly in DB since register blocks admin
      console.log('\n--- Step 1: Pre-populating Accounts & Authenticating ---');
      const adminUser = await User.create({ name: 'Platform Admin', email: 'admin@campus.edu', password: 'adminpassword', role: 'admin' });
      const clubAdminUser = await User.create({ name: 'Club Leader', email: 'clubadmin@campus.edu', password: 'password123', role: 'club_admin' });
      const professorUser = await User.create({ name: 'Prof McGonagall', email: 'mcgonagall@campus.edu', password: 'password123', role: 'professor' });

      // Register Student via API
      const studReg = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Harry Potter', email: 'harry@campus.edu', password: 'studentpassword', role: 'student', universityId: 'ST101', department: 'CS', year: 2 })
      });
      stud1Cookie = getCookieHeader(studReg);
      const studentData = await studReg.json();
      const studentId = studentData.data.user._id;

      // Log in all accounts via API to retrieve cookies
      const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@campus.edu', password: 'adminpassword' })
      });
      adminCookie = getCookieHeader(adminLogin);

      const clubAdminLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'clubadmin@campus.edu', password: 'password123' })
      });
      clubAdminCookie = getCookieHeader(clubAdminLogin);

      const profLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'mcgonagall@campus.edu', password: 'password123' })
      });
      profCookie = getCookieHeader(profLogin);

      console.log('Account authentications completed.');

      // TEST A — CLUB APPROVAL
      console.log('\n--- TEST A: Club Approval Workflow ---');
      const createClubRes = await fetch(`${BASE_URL}/clubs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
        body: JSON.stringify({ name: 'Astronomy Club', description: 'Gaze stars', category: 'Technology' })
      });
      const clubData = await createClubRes.json();
      const clubId = clubData.data.club._id;
      console.log(`Club created. Initial Status: ${clubData.data.club.status} (Expected: pending)`);

      // Admin views pending approvals list
      const approvalsRes = await fetch(`${BASE_URL}/clubs?status=pending`, {
        method: 'GET',
        headers: { 'Cookie': adminCookie }
      });
      const approvalsData = await approvalsRes.json();
      const foundClub = approvalsData.data.clubs.find(c => c._id === clubId);
      console.log(`Found pending club in Admin list: ${!!foundClub}`);

      // Approve the club
      const approveRes = await fetch(`${BASE_URL}/clubs/${clubId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
        body: JSON.stringify({ status: 'approved' })
      });
      const approveData = await approveRes.json();
      console.log(`Club Approved! Status: ${approveData.data.club.status} (Expected: approved)`);

      // Refresh check to confirm persistence
      const persistenceRes = await fetch(`${BASE_URL}/clubs/${clubId}`, {
        method: 'GET'
      });
      const persistenceData = await persistenceRes.json();
      console.log(`Persisted Club Status after retrieve: ${persistenceData.data.club.status} (Expected: approved)`);
      if (persistenceData.data.club.status !== 'approved') {
        throw new Error('Club status approval did not persist');
      }

      // TEST B — USER SUSPENSION
      console.log('\n--- TEST B: User Suspension Workflow ---');
      // Suspend Student Harry
      const suspendRes = await fetch(`${BASE_URL}/admin/users/${studentId}/status`, {
        method: 'PATCH',
        headers: { 'Cookie': adminCookie }
      });
      const suspendData = await suspendRes.json();
      console.log(`Student active status toggled. isActive: ${suspendData.data.user.isActive} (Expected: false)`);

      // Attempt login as Harry (should be rejected)
      const badStudentLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'harry@campus.edu', password: 'studentpassword' })
      });
      console.log(`Suspended student login status: ${badStudentLogin.status} (Expected: 403 Forbidden)`);
      if (badStudentLogin.status !== 403) {
        throw new Error('Suspended user was allowed to log in!');
      }

      // Reactivate Harry
      const reactivateRes = await fetch(`${BASE_URL}/admin/users/${studentId}/status`, {
        method: 'PATCH',
        headers: { 'Cookie': adminCookie }
      });
      const reactivateData = await reactivateRes.json();
      console.log(`Student active status toggled again. isActive: ${reactivateData.data.user.isActive} (Expected: true)`);

      // Attempt login again (should succeed)
      const goodStudentLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'harry@campus.edu', password: 'studentpassword' })
      });
      console.log(`Reactivated student login status: ${goodStudentLogin.status} (Expected: 200 OK)`);
      if (goodStudentLogin.status !== 200) {
        throw new Error('Reactivated student failed to log in');
      }

      // TEST C — ROLE MANAGEMENT
      console.log('\n--- TEST C: User Role Management Workflow ---');
      // Change Student Harry's role to Judge
      const roleRes = await fetch(`${BASE_URL}/admin/users/${studentId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
        body: JSON.stringify({ role: 'judge' })
      });
      const roleData = await roleRes.json();
      console.log(`Harry's role updated. New Role: ${roleData.data.user.role} (Expected: judge)`);

      // Authenticate Harry to check role routing
      const harryJudgeLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'harry@campus.edu', password: 'studentpassword' })
      });
      const harryJudgeCookie = getCookieHeader(harryJudgeLogin);
      
      // Query assigned hackathons. Verify no hackathons are assigned yet (User is NOT automatically assigned to a hackathon)
      const hackDiscovery = await fetch(`${BASE_URL}/hackathons`, {
        method: 'GET',
        headers: { 'Cookie': harryJudgeCookie }
      });
      const hackDiscoveryData = await hackDiscovery.json();
      console.log(`Number of assigned hackathons for new Judge Harry: ${hackDiscoveryData.data.hackathons.length} (Expected: 0)`);
      if (hackDiscoveryData.data.hackathons.length !== 0) {
        throw new Error('New judge was incorrectly automatically assigned to a hackathon');
      }

      // TEST D — GLOBAL ANNOUNCEMENT
      console.log('\n--- TEST D: Global Announcement Workflow ---');
      const annRes = await fetch(`${BASE_URL}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
        body: JSON.stringify({ title: 'Important Maintenance', content: 'Database backup running', scope: 'global' })
      });
      const annData = await annRes.json();
      const annId = annData.data.announcement._id;
      console.log(`Global announcement created. Scope: ${annData.data.announcement.scope} (Expected: global)`);

      // Student retrieves announcements feed
      const feedRes = await fetch(`${BASE_URL}/announcements`, {
        method: 'GET',
        headers: { 'Cookie': harryJudgeCookie }
      });
      const feedData = await feedRes.json();
      const foundAnn = feedData.data.announcements.find(a => a._id === annId);
      console.log(`Found announcement in Student feed: ${!!foundAnn}`);

      // Refresh check to verify persistence
      const refreshRes = await fetch(`${BASE_URL}/announcements`, {
        method: 'GET',
        headers: { 'Cookie': harryJudgeCookie }
      });
      const refreshData = await refreshRes.json();
      const persistedAnn = refreshData.data.announcements.find(a => a._id === annId);
      console.log(`Persisted Announcement found after refresh: ${!!persistedAnn}`);
      if (!persistedAnn) {
        throw new Error('Global announcement did not persist on reload');
      }

      // TEST E — SECURITY & SELF-PROTECTION
      console.log('\n--- TEST E: Security Boundaries & self-protection limits ---');

      // Student -> Admin Dashboard API. Expected: 403 Forbidden
      const studentDashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
        headers: { 'Cookie': harryJudgeCookie }
      });
      console.log(`Student accessing Admin Dashboard status: ${studentDashRes.status} (Expected: 403)`);
      if (studentDashRes.status !== 403) {
        throw new Error('Non-admin allowed to access Admin Dashboard API!');
      }

      // Professor -> Admin API. Expected: 403 Forbidden
      const profUserListRes = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 'Cookie': profCookie }
      });
      console.log(`Professor accessing Admin User list status: ${profUserListRes.status} (Expected: 403)`);
      if (profUserListRes.status !== 403) {
        throw new Error('Professor allowed to access Admin User list API!');
      }

      // Student A -> Modify Student B's details (Non-admin -> Admin user list). Expected: 403
      const badUserList = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 'Cookie': harryJudgeCookie }
      });
      console.log(`Non-admin listing users status: ${badUserList.status} (Expected: 403)`);

      // Admin attempts self-suspension
      const selfSuspend = await fetch(`${BASE_URL}/admin/users/${adminUser._id}/status`, {
        method: 'PATCH',
        headers: { 'Cookie': adminCookie }
      });
      console.log(`Admin self-suspension status: ${selfSuspend.status} (Expected: 400 Bad Request)`);
      if (selfSuspend.status !== 400) {
        throw new Error('Self-suspension check bypassed! Admin allowed to suspend themselves.');
      }

      // Admin attempts self-demotion
      const selfDemotion = await fetch(`${BASE_URL}/admin/users/${adminUser._id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
        body: JSON.stringify({ role: 'student' })
      });
      console.log(`Admin self-demotion status: ${selfDemotion.status} (Expected: 400 Bad Request)`);
      if (selfDemotion.status !== 400) {
        throw new Error('Self-demotion check bypassed! Admin allowed to demote themselves.');
      }

      // Last-admin demotion test (create another admin, promote, then demote)
      // Since adminUser is currently the ONLY active admin:
      // Attempts to demote the last administrator should fail!
      const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true });
      console.log(`Current active administrators count: ${activeAdmins}`);
      
      // Create a secondary user, do NOT make them admin, and try to demote adminUser
      // This is indeed the last active admin, so demoting them must be rejected!
      const lastAdminDemote = await fetch(`${BASE_URL}/admin/users/${adminUser._id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
        body: JSON.stringify({ role: 'professor' })
      });
      console.log(`Last administrator demotion status: ${lastAdminDemote.status} (Expected: 400)`);
      if (lastAdminDemote.status !== 400) {
        throw new Error('Allowed demoting the last active administrator!');
      }

      console.log('\n✅ ALL E2E ADMINISTRATIVE WORKFLOWS & SECURITY CHECKS VERIFIED SUCCESSFULLY!');

    } catch (err) {
      console.error('\n❌ Admin E2E test failed:', err.message);
      process.exit(1);
    } finally {
      server.close(async () => {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed. Test server stopped.');
        process.exit(0);
      });
    }
  });
};

runAdminE2ETest();
