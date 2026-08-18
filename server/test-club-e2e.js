const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const User = require('./models/User');
const Club = require('./models/Club');
const Hackathon = require('./models/Hackathon');
const Team = require('./models/Team');
const TeamInvitation = require('./models/TeamInvitation');
const StudentProfile = require('./models/StudentProfile');

const authRoutes = require('./routes/authRoutes');
const clubRoutes = require('./routes/clubRoutes');
const hackathonRoutes = require('./routes/hackathonRoutes');
const teamRoutes = require('./routes/teamRoutes');
const teamInvitationRoutes = require('./routes/teamInvitationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const errorHandler = require('./middleware/error');

const PORT = 5140;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const getCookieHeader = (res) => {
  const cookies = res.headers.get('set-cookie');
  return cookies ? cookies.split(',').map(c => c.split(';')[0]).join('; ') : '';
};

const runE2ETest = async () => {
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/campushub_club_e2e';
  process.env.JWT_SECRET = 'e2esecret123456';
  process.env.JWT_EXPIRE = '1h';

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Club E2E test database');
    
    await User.deleteMany({});
    await Club.deleteMany({});
    await Hackathon.deleteMany({});
    await Team.deleteMany({});
    await TeamInvitation.deleteMany({});
    await StudentProfile.deleteMany({});
    console.log('Cleaned test database collections');
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
  app.use('/api/v1/teams', teamRoutes);
  app.use('/api/v1/team-invitations', teamInvitationRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);

  app.use(errorHandler);

  const server = app.listen(PORT, async () => {
    console.log(`E2E Test server running on port ${PORT}`);

    let profCookie = '';
    let adminCookie = '';
    let clubAdminACookie = '';
    let clubAdminBCookie = '';
    let stud1Cookie = '';
    let stud2Cookie = '';

    try {
      // Create Admin and Club Admins directly in DB since public registration doesn't support these roles
      await User.create({ name: 'System Admin', email: 'admin@campus.edu', password: 'adminpassword', role: 'admin' });
      await User.create({ name: 'Club Manager A', email: 'cluba@campus.edu', password: 'managerpassword', role: 'club_admin' });
      await User.create({ name: 'Club Manager B', email: 'clubb@campus.edu', password: 'managerpassword', role: 'club_admin' });

      // Register Students via API
      const stud1Reg = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Student Harry', email: 'harry@campus.edu', password: 'studentpassword', role: 'student', universityId: 'ST101', department: 'CS', year: 2 })
      });
      stud1Cookie = getCookieHeader(stud1Reg);

      const stud2Reg = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Student Ron', email: 'ron@campus.edu', password: 'studentpassword', role: 'student', universityId: 'ST102', department: 'CS', year: 2 })
      });
      stud2Cookie = getCookieHeader(stud2Reg);

      // Log in all accounts via API to get cookies
      const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@campus.edu', password: 'adminpassword' })
      });
      adminCookie = getCookieHeader(adminLoginRes);

      const clubALoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cluba@campus.edu', password: 'managerpassword' })
      });
      clubAdminACookie = getCookieHeader(clubALoginRes);

      const clubBLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'clubb@campus.edu', password: 'managerpassword' })
      });
      clubAdminBCookie = getCookieHeader(clubBLoginRes);

      console.log('All test accounts registered & authenticated via API.');

      // Step 2: Club Admin A registers club profile (status: pending)
      console.log('\n--- Step 2: Club Admin A registers Club A ---');
      const createClubRes = await fetch(`${BASE_URL}/clubs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminACookie },
        body: JSON.stringify({ name: 'Dev Club', description: 'Algorithms and hackathons', category: 'Technology' })
      });
      const clubData = await createClubRes.json();
      if (!clubData.success) {
        console.error('Failed to create club. Full response:', clubData);
      }
      const clubId = clubData.data.club._id;
      console.log(`Club registered successfully (ID: ${clubId}, Status: ${clubData.data.club.status})`);

      // Step 3: Verify creation block while pending
      console.log('\n--- Step 3: Testing Hackathon creation block on pending status ---');
      const badHackRes = await fetch(`${BASE_URL}/hackathons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminACookie },
        body: JSON.stringify({ title: 'Winter Hackathon', description: 'Solve challenges', problemStatement: 'Brewing potions', startDate: new Date(), endDate: new Date() })
      });
      console.log(`Create status: ${badHackRes.status} (Expected: 403 Forbidden)`);
      if (badHackRes.status !== 403) {
        throw new Error('Hackathon creation was not blocked on pending club status');
      }

      // Step 4: Admin approves Club A status
      console.log('\n--- Step 4: System Admin approves Club A ---');
      const approveRes = await fetch(`${BASE_URL}/clubs/${clubId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
        body: JSON.stringify({ status: 'approved' })
      });
      const approveData = await approveRes.json();
      console.log(`Club status updated to: ${approveData.data.club.status}`);

      // Step 5: Club Admin A creates Hackathon draft
      console.log('\n--- Step 5: Club Admin A creates Hackathon draft ---');
      const hackRes = await fetch(`${BASE_URL}/hackathons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminACookie },
        body: JSON.stringify({
          title: 'Campus Hack Autumn',
          description: 'Hogwarts Campus League',
          problemStatement: 'Automate potion brewing recipes.',
          startDate: new Date(Date.now() + 100000), // starts in a bit
          endDate: new Date(Date.now() + 800000),
          registrationDeadline: new Date(Date.now() + 50000),
          submissionDeadline: new Date(Date.now() + 500000),
          locationType: 'online',
          location: 'Hogwarts Server',
          minTeamSize: 2,
          maxTeamSize: 4
        })
      });
      const hackData = await hackRes.json();
      const hackId = hackData.data.hackathon._id;
      console.log(`Hackathon draft created (ID: ${hackId}, isPublished: ${hackData.data.hackathon.isPublished})`);

      // Step 6: Edit, Preview, and Publish
      console.log('\n--- Step 6: Modifying & Publishing Hackathon ---');
      // Edit
      await fetch(`${BASE_URL}/hackathons/${hackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminACookie },
        body: JSON.stringify({ problemStatement: 'Advanced sorting logic & potion brewing.' })
      });
      console.log('Hackathon updated with revised problem statement.');

      // Publish
      const pubRes = await fetch(`${BASE_URL}/hackathons/${hackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminACookie },
        body: JSON.stringify({ isPublished: true })
      });
      const pubData = await pubRes.json();
      console.log(`Hackathon published! isPublished: ${pubData.data.hackathon.isPublished}`);

      // Step 7: Test authorization (Club Admin B cannot modify Club Admin A's hackathon)
      console.log('\n--- Step 7: Testing cross-club unauthorized edit block ---');
      const badEditRes = await fetch(`${BASE_URL}/hackathons/${hackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminBCookie },
        body: JSON.stringify({ title: 'Stolen Title' })
      });
      console.log(`Cross-club update status: ${badEditRes.status} (Expected: 403 Forbidden)`);
      if (badEditRes.status !== 403) {
        throw new Error('Cross-club authorization check failed: allowed unauthorized edit');
      }

      // Step 8: Student Discovery
      console.log('\n--- Step 8: Student Harry discovers Published Hackathon ---');
      const discoverRes = await fetch(`${BASE_URL}/hackathons`, {
        method: 'GET',
        headers: { 'Cookie': stud1Cookie }
      });
      const discoverData = await discoverRes.json();
      const found = discoverData.data.hackathons.find(h => h._id === hackId);
      console.log(`Found Hackathon in Student Catalog: ${!!found} ("${found?.title}")`);

      // Step 9: Student creates team ("Create Team & Register")
      console.log('\n--- Step 9: Harry registers & creates team "Gryffindor Coders" ---');
      const createTeamRes = await fetch(`${BASE_URL}/hackathons/${hackId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': stud1Cookie },
        body: JSON.stringify({ name: 'Gryffindor Coders', description: 'Advanced wizard coders' })
      });
      const teamData = await createTeamRes.json();
      const teamId = teamData.data.team._id;
      console.log(`Team registered successfully (ID: ${teamId}, Status: ${teamData.data.team.status})`);

      // Step 10: Invite Student 2
      console.log('\n--- Step 10: Sending invitation to Ron ---');
      const inviteRes = await fetch(`${BASE_URL}/teams/${teamId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': stud1Cookie },
        body: JSON.stringify({ inviteeEmail: 'ron@campus.edu' })
      });
      const inviteData = await inviteRes.json();
      const inviteId = inviteData.data.invitation._id;
      console.log(`Invitation dispatched! (Invitation ID: ${inviteId})`);

      // Step 11: Student 2 accepts invitation
      console.log('\n--- Step 11: Ron accepts invitation ---');
      await fetch(`${BASE_URL}/team-invitations/${inviteId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': stud2Cookie }
      });
      console.log('Ron accepted invitation.');

      // Step 12: Verify membership integration
      console.log('\n--- Step 12: Verifying team member rosters ---');
      const teamRosterRes = await fetch(`${BASE_URL}/teams/my-team?hackathonId=${hackId}`, {
        method: 'GET',
        headers: { 'Cookie': stud1Cookie }
      });
      const rosterData = await teamRosterRes.json();
      const memberNames = rosterData.data.team.members.map(m => m.name);
      console.log(`Current Team members list: ${memberNames.join(', ')}`);

      // Step 13: Testing route guards & permissions
      console.log('\n--- Step 13: Testing student security route protections ---');
      const badDashboardRes = await fetch(`${BASE_URL}/dashboard/club`, {
        method: 'GET',
        headers: { 'Cookie': stud1Cookie }
      });
      console.log(`Student accessing club dashboard status: ${badDashboardRes.status} (Expected: 403)`);

      const badClubRegRes = await fetch(`${BASE_URL}/clubs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': stud1Cookie },
        body: JSON.stringify({ name: 'Student Club', description: 'Stolen Club', category: 'Technology' })
      });
      console.log(`Student registering club status: ${badClubRegRes.status} (Expected: 403)`);

      if (badDashboardRes.status === 403 && badClubRegRes.status === 403 && memberNames.includes('Student Harry') && memberNames.includes('Student Ron')) {
        console.log('\n✅ E2E CLUB & HACKATHON WORKFLOW VERIFIED SUCCESSFULLY!');
      } else {
        throw new Error('E2E validation checks failed: permission check or roster mismatch');
      }

    } catch (err) {
      console.error('\n❌ E2E workflow test failed:', err.message);
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

runE2ETest();
