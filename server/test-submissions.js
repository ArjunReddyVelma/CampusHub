require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const ProfessorProfile = require('./models/ProfessorProfile');
const Club = require('./models/Club');
const Hackathon = require('./models/Hackathon');
const Team = require('./models/Team');
const Submission = require('./models/Submission');

const PORT = 5105;
let server;

const runTests = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/campushub_submissions_test');
    console.log('Connected to submissions test database');
    
    // Clean test database
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await ProfessorProfile.deleteMany({});
    await Club.deleteMany({});
    await Hackathon.deleteMany({});
    await Team.deleteMany({});
    await Submission.deleteMany({});
    console.log('Cleaned test database collections');

    server = app.listen(PORT, async () => {
      console.log(`Submissions test server running on port ${PORT}`);
      try {
        await executeSubmissionsTestSteps();
      } catch (err) {
        console.error('Submissions Test Steps Failed:', err);
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

const executeSubmissionsTestSteps = async () => {
  const authUrl = `http://localhost:${PORT}/api/v1/auth`;
  const hackathonsUrl = `http://localhost:${PORT}/api/v1/hackathons`;
  const submissionsUrl = `http://localhost:${PORT}/api/v1/submissions`;

  // --- Step 1: Set up Users (2 Students, 1 Judge, 1 Admin) ---
  console.log('\n--- Test 1: Setting up Accounts ---');
  
  // Registering judge via Direct DB seeding
  const judgeUser = await User.create({
    name: 'Judge Albus',
    email: 'albus@hogwarts.edu',
    password: 'magicpassword',
    role: 'judge'
  });
  console.log('Judge account seeded directly into DB');

  // Registering club_admin
  const clubAdmin = await User.create({
    name: 'Club Organizer',
    email: 'organizer@campushub.edu',
    password: 'password123',
    role: 'club_admin'
  });

  // Students public registration
  const regS1 = await fetch(`${authUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Student Harry',
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
      name: 'Student Ron',
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
  const jCookie = await getCookie('albus@hogwarts.edu', 'magicpassword');

  console.log('Authentication cookies retrieved');

  // --- Step 2: Seed Club, Hackathon and Team ---
  console.log('\n--- Test 2: Seeding Club, Hackathon with Judge and Team ---');
  const club = await Club.create({
    name: 'Gryffindor Developer Club',
    description: 'Coding miracles',
    category: 'Technical',
    owner: clubAdmin._id,
    status: 'approved'
  });

  const now = new Date();
  const startDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // started 2 hours ago
  const endDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const hackathon = await Hackathon.create({
    club: club._id,
    title: 'Hogwarts Codefest 2026',
    description: 'Automate potion creation',
    problemStatement: 'Track cauldron temperatures',
    startDate,
    endDate,
    registrationDeadline: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago (before start date)
    submissionDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    minTeamSize: 2,
    maxTeamSize: 3,
    judges: [judgeUser._id],
    isPublished: true
  });

  // Fetch created student user objects to form Team
  const harryObj = await User.findOne({ email: 'harry@hogwarts.edu' });
  const ronObj = await User.findOne({ email: 'ron@hogwarts.edu' });

  const team = await Team.create({
    hackathon: hackathon._id,
    name: 'Gryffindor Team A',
    leader: harryObj._id,
    members: [harryObj._id, ronObj._id],
    status: 'complete' // Met the minTeamSize requirement!
  });

  console.log('Database seeded with complete Team (size: 2) for Published Hackathon');

  // --- Step 3: Student Submits Project ---
  console.log('\n--- Test 3: Harry Submits Project ---');
  const submitRes = await fetch(`${hackathonsUrl}/${hackathon._id}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': hCookie },
    body: JSON.stringify({
      repositoryUrl: 'https://github.com/potter/cauldron-temp',
      demoVideoUrl: 'https://youtube.com/watch?v=cauldron-temp',
      description: 'Cauldron automation tracking dashboard using Node.js'
    })
  });
  const submitData = await submitRes.json();
  if (submitRes.status !== 201) throw new Error(`Submission failed: ${JSON.stringify(submitData)}`);
  
  const submissionId = submitData.data.submission._id;
  console.log('Project submitted successfully with ID:', submissionId);

  // Verify Team status updated to 'submitted'
  const teamAfterSubObj = await Team.findById(team._id);
  if (teamAfterSubObj.status !== 'submitted') {
    throw new Error(`Team status should be 'submitted', got: ${teamAfterSubObj.status}`);
  }
  console.log('Team status successfully updated to "submitted"');

  // --- Step 4: Overwrite Submission ---
  console.log('\n--- Test 4: Harry updates/overwrites Project Submission ---');
  const overwriteRes = await fetch(`${hackathonsUrl}/${hackathon._id}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': hCookie },
    body: JSON.stringify({
      repositoryUrl: 'https://github.com/potter/cauldron-temp-v2',
      demoVideoUrl: 'https://youtube.com/watch?v=cauldron-temp-v2',
      description: 'Updated cauldron automation with React dashboard'
    })
  });
  const overwriteData = await overwriteRes.json();
  if (overwriteRes.status !== 200) throw new Error(`Overwrite failed: ${JSON.stringify(overwriteData)}`);
  
  if (overwriteData.data.submission.repositoryUrl !== 'https://github.com/potter/cauldron-temp-v2') {
    throw new Error('Repository URL was not updated during overwrite check');
  }
  console.log('Project submission successfully updated (Overwrite constraint passed)');

  // --- Step 5: Student attempts to evaluate (Should fail) ---
  console.log('\n--- Test 5: Student Harry tries to evaluate own submission (Should be Blocked) ---');
  const studEvalRes = await fetch(`${submissionsUrl}/${submissionId}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': hCookie },
    body: JSON.stringify({
      criteriaScores: [
        { criteria: 'Novelty', score: 10 },
        { criteria: 'Technical', score: 10 }
      ],
      feedback: 'Amazing!'
    })
  });
  const studEvalData = await studEvalRes.json();
  if (studEvalRes.status !== 403) {
    throw new Error(`Student should be blocked from evaluating, got status ${studEvalRes.status}`);
  }
  console.log('Student successfully blocked from evaluating (Status 403):', studEvalData.message);

  // --- Step 6: Assigned Judge evaluates submission ---
  console.log('\n--- Test 6: Assigned Judge evaluates submission ---');
  const judgeEvalRes = await fetch(`${submissionsUrl}/${submissionId}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': jCookie },
    body: JSON.stringify({
      criteriaScores: [
        { criteria: 'Novelty', score: 8, maxScore: 10 },
        { criteria: 'Feasibility', score: 9, maxScore: 10 },
        { criteria: 'Complexity', score: 8, maxScore: 10 }
      ],
      feedback: 'Outstanding use of telemetry data in magical brewing.'
    })
  });
  const judgeEvalData = await judgeEvalRes.json();
  if (judgeEvalRes.status !== 200 || !judgeEvalData.success) {
    throw new Error(`Judge evaluation failed: ${JSON.stringify(judgeEvalData)}`);
  }
  
  const score = judgeEvalData.data.submission.finalScore;
  const status = judgeEvalData.data.submission.status;
  if (score !== 25 || status !== 'evaluated') {
    throw new Error(`Incorrect score evaluation or status. Expected final score: 25, got: ${score}. Expected status: evaluated, got: ${status}`);
  }
  console.log(`Submission evaluated successfully! Final Score: ${score}/30, Status: ${status}`);

  // --- Step 7: Submission Window Expiration validation ---
  console.log('\n--- Test 7: Verifying Submission window date boundaries check ---');
  // Update submissionDeadline to past date
  const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute in the past
  await Hackathon.findByIdAndUpdate(hackathon._id, { submissionDeadline: pastDate });
  console.log('Directly set submissionDeadline to 1 minute in the past');

  const expiredSubRes = await fetch(`${hackathonsUrl}/${hackathon._id}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': hCookie },
    body: JSON.stringify({
      repositoryUrl: 'https://github.com/potter/cauldron-temp-v3',
      description: 'Late submission'
    })
  });
  const expiredSubData = await expiredSubRes.json();
  if (expiredSubRes.status !== 400 || expiredSubData.success) {
    throw new Error(`Late submission should have been blocked, got status ${expiredSubRes.status}`);
  }
  console.log('Late submission successfully blocked (Status 400):', expiredSubData.message);

  console.log('\nALL SUBMISSION & JUDGING TESTS PASSED SUCCESSFULLY! 🚀');
};

runTests();
