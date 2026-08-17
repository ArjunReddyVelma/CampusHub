require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const ProfessorProfile = require('./models/ProfessorProfile');
const Club = require('./models/Club');
const Announcement = require('./models/Announcement');
const Notification = require('./models/Notification');
const Hackathon = require('./models/Hackathon');
const Quiz = require('./models/Quiz');

const PORT = 5108;
let server;

const runTests = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/campushub_announcements_test');
    console.log('Connected to announcements test database');
    
    // Clean test database
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await ProfessorProfile.deleteMany({});
    await Club.deleteMany({});
    await Announcement.deleteMany({});
    await Notification.deleteMany({});
    await Hackathon.deleteMany({});
    await Quiz.deleteMany({});
    console.log('Cleaned test database collections');

    server = app.listen(PORT, async () => {
      console.log(`Announcements test server running on port ${PORT}`);
      try {
        await executeAnnouncementsTestSteps();
      } catch (err) {
        console.error('Announcements Test Steps Failed:', err);
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

const executeAnnouncementsTestSteps = async () => {
  const authUrl = `http://localhost:${PORT}/api/v1/auth`;
  const announceUrl = `http://localhost:${PORT}/api/v1/announcements`;
  const notifyUrl = `http://localhost:${PORT}/api/v1/notifications`;
  const adminUrl = `http://localhost:${PORT}/api/v1/admin`;

  // --- Step 1: Set up Users (2 Students, 1 Club Admin, 1 Admin) ---
  console.log('\n--- Test 1: Setting up Accounts ---');
  
  const adminUser = await User.create({
    name: 'Admin Moderator',
    email: 'admin@campushub.edu',
    password: 'adminpassword',
    role: 'admin'
  });

  const clubAdmin = await User.create({
    name: 'Club Organizer',
    email: 'organizer@campushub.edu',
    password: 'password123',
    role: 'club_admin'
  });

  const regS1 = await fetch(`${authUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Harry Student',
      email: 'harry@hogwarts.edu',
      password: 'password123',
      role: 'student',
      universityId: 'STUD001',
      department: 'Gryffindor',
      year: 1
    })
  });
  if (regS1.status !== 201) throw new Error('Harry registration failed');

  const regS2 = await fetch(`${authUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ron Student',
      email: 'ron@hogwarts.edu',
      password: 'password123',
      role: 'student',
      universityId: 'STUD002',
      department: 'Gryffindor',
      year: 1
    })
  });
  if (regS2.status !== 201) throw new Error('Ron registration failed');

  // Log in functions to get cookies
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

  const hCookie = await getCookie('harry@hogwarts.edu', 'password123');
  const rCookie = await getCookie('ron@hogwarts.edu', 'password123');
  const adminCookie = await getCookie('admin@campushub.edu', 'adminpassword');
  const clubAdminCookie = await getCookie('organizer@campushub.edu', 'password123');

  console.log('Authentication cookies retrieved');

  // Seed Club
  const club = await Club.create({
    name: 'Gryffindor Developer Club',
    description: 'Magical coding',
    category: 'Technical',
    owner: clubAdmin._id,
    status: 'approved'
  });

  // Make Harry a member of the club, but NOT Ron
  const harryObj = await User.findOne({ email: 'harry@hogwarts.edu' });
  const ronObj = await User.findOne({ email: 'ron@hogwarts.edu' });
  
  club.members.push(harryObj._id);
  await club.save();
  console.log('Harry joined Gryffindor Developer Club. Ron is not a member.');

  // --- Step 2: Post Club Announcement ---
  console.log('\n--- Test 2: Club Admin posts Club-Scoped Announcement ---');
  const announceRes = await fetch(announceUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
    body: JSON.stringify({
      title: 'Secret Club Meeting',
      content: 'Meeting tonight at Gryffindor common room',
      scope: 'club',
      targetId: club._id
    })
  });
  const announceData = await announceRes.json();
  if (announceRes.status !== 201) throw new Error(`Announcement failed: ${JSON.stringify(announceData)}`);
  console.log('Club Announcement posted successfully');

  // --- Step 3: Harry Fetches Announcements (Should see the club one) ---
  console.log('\n--- Test 3: Harry (Club Member) fetches Announcements ---');
  const harryAnnounceRes = await fetch(announceUrl, {
    method: 'GET',
    headers: { 'Cookie': hCookie }
  });
  const harryAnnounceData = await harryAnnounceRes.json();
  const harryList = harryAnnounceData.data.announcements;
  
  const hasClubAnnounce = harryList.some(ann => ann.title === 'Secret Club Meeting');
  if (!hasClubAnnounce) throw new Error('Harry should see the club announcement but did not');
  console.log(`Harry fetched announcements. Found: "${harryList[0].title}"`);

  // --- Step 4: Ron Fetches Announcements (Should NOT see the club one) ---
  console.log('\n--- Test 4: Ron (Non-Member) fetches Announcements ---');
  const ronAnnounceRes = await fetch(announceUrl, {
    method: 'GET',
    headers: { 'Cookie': rCookie }
  });
  const ronAnnounceData = await ronAnnounceRes.json();
  const ronList = ronAnnounceData.data.announcements;
  
  const ronHasClubAnnounce = ronList.some(ann => ann.title === 'Secret Club Meeting');
  if (ronHasClubAnnounce) throw new Error('Security Violation: Ron saw the club announcement even though he is not a member!');
  console.log('Ron successfully excluded from club-scoped announcement');

  // --- Step 5: Notifications management ---
  console.log('\n--- Test 5: Notifications retrieval and read tracking ---');
  // Seed a notification for Harry
  const notification = await Notification.create({
    recipient: harryObj._id,
    title: 'Welcome to CampusHub',
    message: 'Enjoy your stay',
    type: 'info'
  });

  const getNotifyRes = await fetch(notifyUrl, {
    method: 'GET',
    headers: { 'Cookie': hCookie }
  });
  const getNotifyData = await getNotifyRes.json();
  const notificationId = getNotifyData.data.notifications[0]._id;
  console.log(`Harry retrieved notifications. Found title: "${getNotifyData.data.notifications[0].title}"`);

  // Mark as read
  const readRes = await fetch(`${notifyUrl}/${notificationId}/read`, {
    method: 'PATCH',
    headers: { 'Cookie': hCookie }
  });
  const readData = await readRes.json();
  if (readRes.status !== 200 || !readData.data.notification.isRead) {
    throw new Error(`Mark as read failed: ${JSON.stringify(readData)}`);
  }
  console.log('Notification successfully marked as read');

  // --- Step 6: Admin Dashboard Metrics ---
  console.log('\n--- Test 6: Admin fetches Admin Dashboard stats ---');
  // Let's seed a quiz and a hackathon to get non-zero counters
  await Quiz.create({
    professor: adminUser._id,
    title: 'Trivia',
    duration: 10,
    startTime: new Date(),
    endTime: new Date(Date.now() + 1000000),
    totalMarks: 10,
    passingMarks: 5
  });

  await Hackathon.create({
    club: club._id,
    title: 'Codefest',
    description: 'Code solutions',
    problemStatement: 'Problem A',
    startDate: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes in future
    endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours in future
    registrationDeadline: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes in future (before start)
    submissionDeadline: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour in future
  });

  const adminStatsRes = await fetch(`${adminUrl}/dashboard`, {
    method: 'GET',
    headers: { 'Cookie': adminCookie }
  });
  const adminStatsData = await adminStatsRes.json();
  if (adminStatsRes.status !== 200 || !adminStatsData.success) {
    throw new Error(`Admin dashboard failed: ${JSON.stringify(adminStatsData)}`);
  }
  
  const stats = adminStatsData.data;
  console.log('Admin Dashboard Stats loaded successfully:');
  console.log(` - Total Users: ${stats.users.total} (Students: ${stats.users.students}, Admins: ${stats.users.admins})`);
  console.log(` - Total Clubs: ${stats.clubs.total} (Approved: ${stats.clubs.approved})`);
  console.log(` - Total Hackathons: ${stats.hackathons.total}`);
  console.log(` - Quizzes: ${stats.quizzesCount}`);

  // Non-admins should be blocked
  const studOnAdminRes = await fetch(`${adminUrl}/dashboard`, {
    method: 'GET',
    headers: { 'Cookie': hCookie }
  });
  if (studOnAdminRes.status !== 403) {
    throw new Error(`Student should have been blocked from Admin Dashboard, got status: ${studOnAdminRes.status}`);
  }
  console.log('Student successfully blocked from Admin Dashboard (Status 403)');

  console.log('\nALL ANNOUNCEMENTS, NOTIFICATIONS & ADMIN TESTS PASSED SUCCESSFULLY! 🚀');
};

runTests();
