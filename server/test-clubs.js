require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const User = require('./models/User');
const Club = require('./models/Club');
const Hackathon = require('./models/Hackathon');

const PORT = 5098;
let server;

const runTests = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/campushub_clubs_test');
    console.log('Connected to clubs test database');
    
    // Clean test database
    await User.deleteMany({});
    await Club.deleteMany({});
    await Hackathon.deleteMany({});
    console.log('Cleaned test database collections');

    server = app.listen(PORT, async () => {
      console.log(`Clubs test server running on port ${PORT}`);
      try {
        await executeClubsTestSteps();
      } catch (err) {
        console.error('Clubs Test Steps Failed:', err);
        process.exitCode = 1;
      } finally {
        server.close(async () => {
          await mongoose.connection.close();
          console.log('Database connection closed. Test server stopped.');
          process.exit(process.exitCode || 0);
        });
      }
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
};

const executeClubsTestSteps = async () => {
  const authUrl = `http://localhost:${PORT}/api/v1/auth`;
  const clubsUrl = `http://localhost:${PORT}/api/v1/clubs`;
  const hackathonsUrl = `http://localhost:${PORT}/api/v1/hackathons`;

  // --- Step 1: Create Accounts (admin, club_admin, student) ---
  console.log('\n--- Test 1: Setting up Accounts ---');
  
  // Registering admin via Direct DB seeding (since registration blocks manual admin selection)
  const adminUser = await User.create({
    name: 'Admin Moderator',
    email: 'admin@campushub.edu',
    password: 'adminpassword',
    role: 'admin'
  });
  console.log('Admin account seeded directly into DB');

  // Registering club_admin via direct DB seeding
  const clubAdminUser = await User.create({
    name: 'Club Manager',
    email: 'manager@campushub.edu',
    password: 'managerpassword',
    role: 'club_admin'
  });
  console.log('Club Admin account seeded directly into DB');

  // Student public registration
  const regStudent = await fetch(`${authUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Student Potter',
      email: 'potter@hogwarts.edu',
      password: 'quidditch_star',
      role: 'student',
      universityId: 'STUD001',
      department: 'Gryffindor',
      year: 2
    })
  });
  const regStudentData = await regStudent.json();
  if (regStudent.status !== 201) throw new Error(`Student registration failed: ${JSON.stringify(regStudentData)}`);

  // Log in accounts to get cookies
  const getCookie = async (email, password) => {
    const loginRes = await fetch(`${authUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const cookies = loginRes.headers.get('set-cookie');
    if (cookies) {
      const match = cookies.match(/token=([^;]+)/);
      if (match) return match[0];
    }
    return '';
  };

  const adminCookie = await getCookie('admin@campushub.edu', 'adminpassword');
  const clubAdminCookie = await getCookie('manager@campushub.edu', 'managerpassword');
  const studentCookie = await getCookie('potter@hogwarts.edu', 'quidditch_star');

  console.log('Tokens and cookies retrieved for all roles');

  // --- Step 2: Club Admin Creates a Club (Status should be Pending) ---
  console.log('\n--- Test 2: Club Admin Registers Club (Expect status: pending) ---');
  const clubPayload = {
    name: 'Coding Club',
    description: 'We code algorithms',
    category: 'Technical',
    socialLinks: { github: 'github.com/coding-club' },
    contactInfo: 'coding@campushub.edu',
    facultyCoordinator: 'Dr. McGonagall'
  };

  const createClubRes = await fetch(clubsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
    body: JSON.stringify(clubPayload)
  });
  const createClubData = await createClubRes.json();
  if (createClubRes.status !== 201) throw new Error(`Club creation failed: ${JSON.stringify(createClubData)}`);
  
  const clubId = createClubData.data.club._id;
  const clubStatus = createClubData.data.club.status;
  if (clubStatus !== 'pending') throw new Error(`Club status should be pending, got: ${clubStatus}`);
  console.log(`Club registered successfully (ID: ${clubId}, Status: ${clubStatus})`);

  // --- Step 3: Club Admin tries to create a Hackathon for pending club (Should fail) ---
  console.log('\n--- Test 3: Club Admin attempts to launch Hackathon with Pending Club (Should be Blocked) ---');
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const hackPayload = {
    title: 'CodeSprint 2026',
    description: '24-hour hackathon',
    problemStatement: 'Optimize algorithmic data flows',
    startDate: now.toISOString(),
    endDate: tomorrow.toISOString(),
    registrationDeadline: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    submissionDeadline: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString()
  };

  const createHackRes = await fetch(hackathonsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
    body: JSON.stringify(hackPayload)
  });
  const createHackData = await createHackRes.json();
  if (createHackRes.status !== 403 || createHackData.success) {
    throw new Error(`Hackathon creation should have failed for pending club, got status ${createHackRes.status}`);
  }
  console.log('Hackathon creation successfully blocked for pending club (Status 403):', createHackData.message);

  // --- Step 4: Club Admin tries to register a second Club (Should fail) ---
  console.log('\n--- Test 4: Club Admin tries to register a second Club (Should be Blocked) ---');
  const secondClubRes = await fetch(clubsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
    body: JSON.stringify({
      name: 'Robotics Club',
      description: 'Build robots',
      category: 'Technical'
    })
  });
  const secondClubData = await secondClubRes.json();
  if (secondClubRes.status !== 400 || secondClubData.success) {
    throw new Error(`Second club registration should have failed, got status ${secondClubRes.status}`);
  }
  console.log('Second club registration successfully blocked (Status 400):', secondClubData.message);

  // --- Step 5: Admin Approves the Club ---
  console.log('\n--- Test 5: Admin Approves the Club ---');
  const approveRes = await fetch(`${clubsUrl}/${clubId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({ status: 'approved' })
  });
  const approveData = await approveRes.json();
  if (approveRes.status !== 200 || approveData.data.club.status !== 'approved') {
    throw new Error(`Approval failed: ${JSON.stringify(approveData)}`);
  }
  console.log('Club status updated to approved successfully');

  // --- Step 6: Club Admin creates Hackathon draft for approved club (Should succeed) ---
  console.log('\n--- Test 6: Club Admin creates Hackathon with Approved Club ---');
  const createHackSuccessRes = await fetch(hackathonsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
    body: JSON.stringify(hackPayload)
  });
  const createHackSuccessData = await createHackSuccessRes.json();
  if (createHackSuccessRes.status !== 201) {
    throw new Error(`Hackathon creation failed for approved club: ${JSON.stringify(createHackSuccessData)}`);
  }
  
  const hackId = createHackSuccessData.data.hackathon._id;
  console.log(`Hackathon draft created successfully (ID: ${hackId})`);

  // --- Test 7: Student fetches draft hackathon (Should be Blocked) ---
  console.log('\n--- Test 7: Student fetches draft Hackathon (Should be Blocked) ---');
  const getDraftRes = await fetch(`${hackathonsUrl}/${hackId}`, {
    method: 'GET',
    headers: { 'Cookie': studentCookie }
  });
  const getDraftData = await getDraftRes.json();
  if (getDraftRes.status !== 403) {
    throw new Error(`Student should be blocked from draft hackathon, got status ${getDraftRes.status}`);
  }
  console.log('Student successfully blocked from draft hackathon (Status 403):', getDraftData.message);

  // --- Test 8: Club Admin publishes the Hackathon ---
  console.log('\n--- Test 8: Club Admin Publishes the Hackathon ---');
  const publishRes = await fetch(`${hackathonsUrl}/${hackId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
    body: JSON.stringify({ isPublished: true })
  });
  const publishData = await publishRes.json();
  if (publishRes.status !== 200 || !publishData.data.hackathon.isPublished) {
    throw new Error(`Publish failed: ${JSON.stringify(publishData)}`);
  }
  console.log('Hackathon published successfully');

  // --- Test 9: Student fetches published hackathon details ---
  console.log('\n--- Test 9: Student fetches published Hackathon ---');
  const getPubRes = await fetch(`${hackathonsUrl}/${hackId}`, {
    method: 'GET',
    headers: { 'Cookie': studentCookie }
  });
  const getPubData = await getPubRes.json();
  if (getPubRes.status !== 200) {
    throw new Error(`Student fetch published hackathon failed: ${JSON.stringify(getPubData)}`);
  }
  console.log(`Student successfully retrieved published Hackathon details for: ${getPubData.data.hackathon.title}`);

  console.log('\nALL CLUB & HACKATHON TESTS PASSED SUCCESSFULLY! 🚀');
};

runTests();
