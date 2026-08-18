const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const User = require('./models/User');
const Club = require('./models/Club');
const Hackathon = require('./models/Hackathon');
const Team = require('./models/Team');
const Submission = require('./models/Submission');
const StudentProfile = require('./models/StudentProfile');

const authRoutes = require('./routes/authRoutes');
const clubRoutes = require('./routes/clubRoutes');
const hackathonRoutes = require('./routes/hackathonRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const teamRoutes = require('./routes/teamRoutes');

const errorHandler = require('./middleware/error');

const PORT = 5150;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const getCookieHeader = (res) => {
  const cookies = res.headers.get('set-cookie');
  return cookies ? cookies.split(',').map(c => c.split(';')[0]).join('; ') : '';
};

const runSubmissionsE2ETest = async () => {
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/campushub_submissions_e2e';
  process.env.JWT_SECRET = 'e2esecret123456';
  process.env.JWT_EXPIRE = '1h';

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Submissions E2E database');
    
    await User.deleteMany({});
    await Club.deleteMany({});
    await Hackathon.deleteMany({});
    await Team.deleteMany({});
    await Submission.deleteMany({});
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
  app.use('/api/v1/submissions', submissionRoutes);
  app.use('/api/v1/teams', teamRoutes);

  app.use(errorHandler);

  const server = app.listen(PORT, async () => {
    console.log(`Submissions E2E Test server running on port ${PORT}`);

    let adminCookie = '';
    let clubAdminCookie = '';
    let stud1Cookie = '';
    let stud2Cookie = '';
    let stud3Cookie = '';
    let judge1Cookie = '';
    let judge2Cookie = '';

    try {
      // Step 1: Pre-populate accounts directly in DB since public register blocks admins/judges
      console.log('\n--- Step 1: Registering Accounts & Authenticating ---');
      
      const adminUser = await User.create({ name: 'System Admin', email: 'admin@campus.edu', password: 'adminpassword', role: 'admin' });
      const clubAdminUser = await User.create({ name: 'Club Leader A', email: 'clubadmin@campus.edu', password: 'password123', role: 'club_admin' });
      const judge1User = await User.create({ name: 'Judge Professor Snape', email: 'snape@hogwarts.edu', password: 'password123', role: 'judge' });
      const judge2User = await User.create({ name: 'Judge Gilderoy', email: 'gilderoy@hogwarts.edu', password: 'password123', role: 'judge' });

      // Register Students via API
      const stud1Reg = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Harry Potter', email: 'harry@campus.edu', password: 'studentpassword', role: 'student', universityId: 'ST101', department: 'CS', year: 2 })
      });
      stud1Cookie = getCookieHeader(stud1Reg);

      const stud2Reg = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Ron Weasley', email: 'ron@campus.edu', password: 'studentpassword', role: 'student', universityId: 'ST102', department: 'CS', year: 2 })
      });
      stud2Cookie = getCookieHeader(stud2Reg);

      const stud3Reg = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Draco Malfoy', email: 'draco@campus.edu', password: 'studentpassword', role: 'student', universityId: 'ST103', department: 'CS', year: 2 })
      });
      stud3Cookie = getCookieHeader(stud3Reg);

      // Authenticate directly registered roles to obtain cookies
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

      const judge1Login = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'snape@hogwarts.edu', password: 'password123' })
      });
      judge1Cookie = getCookieHeader(judge1Login);

      const judge2Login = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'gilderoy@hogwarts.edu', password: 'password123' })
      });
      judge2Cookie = getCookieHeader(judge2Login);

      console.log('Account authentications completed.');

      // Step 2: Establish club and approved status
      console.log('\n--- Step 2: Setting up approved Club ---');
      const clubRes = await fetch(`${BASE_URL}/clubs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
        body: JSON.stringify({ name: 'Potions Club', description: 'Advanced Potion brewing', category: 'Technology' })
      });
      const clubData = await clubRes.json();
      const clubId = clubData.data.club._id;

      // Admin approves club status
      await fetch(`${BASE_URL}/clubs/${clubId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
        body: JSON.stringify({ status: 'approved' })
      });
      console.log('Potions Club created & status updated to approved.');

      // Step 3: Club Admin A creates Hackathons
      console.log('\n--- Step 3: Club Admin creates Hackathons with custom Judging Criteria & Judges ---');
      
      // Hackathon A: assigned to Snape, custom criteria
      const hackARes = await fetch(`${BASE_URL}/hackathons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
        body: JSON.stringify({
          title: 'Wizarding Coding Cup',
          description: 'Brew potion algorithms',
          problemStatement: 'Snape challenge recipes.',
          startDate: new Date(Date.now() + 100000), // active in future
          endDate: new Date(Date.now() + 800000),
          registrationDeadline: new Date(Date.now() + 50000), // open reg
          submissionDeadline: new Date(Date.now() + 500000),
          locationType: 'online',
          location: 'Hogwarts Server',
          minTeamSize: 1,
          maxTeamSize: 2,
          judgingCriteria: ['Potion Code', 'Spell Design', 'Wand Optimization'],
          judges: [judge1User._id]
        })
      });
      const hackAData = await hackARes.json();
      const hackAId = hackAData.data.hackathon._id;

      // Publish Hackathon A
      await fetch(`${BASE_URL}/hackathons/${hackAId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
        body: JSON.stringify({ isPublished: true })
      });

      // Hackathon B: assigned to Gilderoy, different criteria
      const hackBRes = await fetch(`${BASE_URL}/hackathons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
        body: JSON.stringify({
          title: 'Dark Arts Defense Hack',
          description: 'Shield efficiency testing',
          problemStatement: 'Boggart containment.',
          startDate: new Date(Date.now() + 100000),
          endDate: new Date(Date.now() + 800000),
          registrationDeadline: new Date(Date.now() + 50000),
          submissionDeadline: new Date(Date.now() + 500000),
          locationType: 'online',
          location: 'DADA Office',
          minTeamSize: 1,
          maxTeamSize: 2,
          judgingCriteria: ['Shield Efficacy', 'Counterspell Speed'],
          judges: [judge2User._id]
        })
      });
      const hackBData = await hackBRes.json();
      const hackBId = hackBData.data.hackathon._id;

      // Publish Hackathon B
      await fetch(`${BASE_URL}/hackathons/${hackBId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
        body: JSON.stringify({ isPublished: true })
      });
      console.log('Hackathon A (Wizarding Cup) & Hackathon B (Dark Arts) published.');

      // Step 4: Student registers teams while registration is open
      console.log('\n--- Step 4: Registering Teams while registration is open ---');
      // Create team for Hackathon A
      const teamRes = await fetch(`${BASE_URL}/hackathons/${hackAId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': stud1Cookie },
        body: JSON.stringify({ name: 'Gryffindor Potions Team' })
      });
      const teamData = await teamRes.json();
      if (!teamData.success) {
        console.error('Failed to create team A. Full response:', teamData);
      }
      const teamId = teamData.data.team._id;

      // Create team for Hackathon B
      const teamBRes = await fetch(`${BASE_URL}/hackathons/${hackBId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': stud3Cookie },
        body: JSON.stringify({ name: 'Slytherin Shield Team' })
      });
      const teamBData = await teamBRes.json();
      if (!teamBData.success) {
        console.error('Failed to create team B. Full response:', teamBData);
      }

      // Step 5: Shift Hackathon dates to active submission hacking phase
      console.log('\n--- Step 5: Shifting Hackathon dates to enable project submissions ---');
      await fetch(`${BASE_URL}/hackathons/${hackAId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
        body: JSON.stringify({
          registrationDeadline: new Date(Date.now() - 200000),
          startDate: new Date(Date.now() - 100000)
        })
      });
      await fetch(`${BASE_URL}/hackathons/${hackBId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': clubAdminCookie },
        body: JSON.stringify({
          registrationDeadline: new Date(Date.now() - 200000),
          startDate: new Date(Date.now() - 100000)
        })
      });
      console.log('Hackathon dates shifted into the past.');

      // Step 6: Assigned Hackathon Discovery
      console.log('\n--- Step 6: Assigned Hackathon Discovery Check ---');
      const snapeDiscoveryRes = await fetch(`${BASE_URL}/hackathons`, {
        method: 'GET',
        headers: { 'Cookie': judge1Cookie }
      });
      const snapeDiscoveryData = await snapeDiscoveryRes.json();
      const snapeHackList = snapeDiscoveryData.data.hackathons.map(h => h.title);
      console.log(`Assigned Hackathons for Snape: ${snapeHackList.join(', ')}`);
      if (snapeHackList.includes('Dark Arts Defense Hack')) {
        throw new Error('Snape discovered Hackathon B which he is not assigned to judge!');
      }

      // Step 7: Student Harry submits project
      console.log('\n--- Step 7: Student Harry submits project ---');
      const subRes = await fetch(`${BASE_URL}/hackathons/${hackAId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': stud1Cookie },
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/harry/potions-recipes',
          demoVideoUrl: 'https://youtube.com/watch?v=felix-felicis',
          description: 'Dynamic Felix Felicis brewing logic.'
        })
      });
      const subData = await subRes.json();
      const submissionId = subData.data.submission._id;
      console.log(`Harry submitted team project (Submission ID: ${submissionId})`);

      // Step 6: Verify Student Submissions Access Block
      console.log('\n--- Step 6: Testing Hackathon Submissions List Route protections ---');
      
      // Harry attempts to call GET submissions list. Expected: 403 Forbidden
      const badListRes = await fetch(`${BASE_URL}/hackathons/${hackAId}/submissions`, {
        method: 'GET',
        headers: { 'Cookie': stud1Cookie }
      });
      console.log(`Student accessing submissions list status: ${badListRes.status} (Expected: 403)`);
      if (badListRes.status !== 403) {
        throw new Error('Student allowed to access GET submissions list route!');
      }

      // Draco attempts to submit for Harry's team (Draco has no team/is not on Harry's team)
      const badSubRes = await fetch(`${BASE_URL}/hackathons/${hackAId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': stud3Cookie },
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/draco/potions-theft',
          description: 'Slytherin attempt'
        })
      });
      console.log(`Slytherin student submitting status: ${badSubRes.status} (Expected: 400 - Not registered in team)`);
      if (badSubRes.status === 201) {
        throw new Error('Draco allowed to submit project without being on a valid team for Hackathon A!');
      }

      // Step 7: Judge Snape evaluates Harry's project using Dynamic criteria
      console.log('\n--- Step 7: Judge Snape evaluates project using Dynamic Criteria ---');
      const evalRes = await fetch(`${BASE_URL}/submissions/${submissionId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': judge1Cookie },
        body: JSON.stringify({
          criteriaScores: [
            { criteria: 'Potion Code', score: 9 },
            { criteria: 'Spell Design', score: 8 },
            { criteria: 'Wand Optimization', score: 10 }
          ],
          feedback: 'Excellent recipe formulas and code safety!'
        })
      });
      const evalData = await evalRes.json();
      console.log(`Evaluation status: ${evalRes.status}, Authoritative Final Score: ${evalData.data.submission.finalScore}`);
      if (evalData.data.submission.finalScore !== 27) {
        throw new Error(`Expected final average score to be 27, but got ${evalData.data.submission.finalScore}`);
      }

      // Step 8: Unassigned Judge Gilderoy attempts to evaluate
      console.log('\n--- Step 8: Unassigned Judge Gilderoy attempts to evaluate ---');
      const badEvalRes = await fetch(`${BASE_URL}/submissions/${submissionId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': judge2Cookie },
        body: JSON.stringify({
          criteriaScores: [{ criteria: 'Potion Code', score: 10 }],
          feedback: 'Unassigned judge edit attempt'
        })
      });
      console.log(`Unassigned Judge evaluation status: ${badEvalRes.status} (Expected: 403)`);
      if (badEvalRes.status !== 403) {
        throw new Error('Unassigned judge allowed to evaluate project!');
      }

      // Step 9: Judge Snape attempts to evaluate Hackathon B
      // Submit a project for Hackathon B using Draco's (stud3) session (team already created at Step 4)
      const subBRes = await fetch(`${BASE_URL}/hackathons/${hackBId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': stud3Cookie },
        body: JSON.stringify({
          repositoryUrl: 'https://github.com/draco/shields',
          description: 'Slytherin shield defense.'
        })
      });
      const subBData = await subBRes.json();
      const submissionBId = subBData.data.submission._id;

      console.log('\n--- Step 9: Judge Snape attempts to evaluate Hackathon B submission ---');
      const badCrossEvalRes = await fetch(`${BASE_URL}/submissions/${submissionBId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': judge1Cookie },
        body: JSON.stringify({
          criteriaScores: [{ criteria: 'Shield Efficacy', score: 10 }],
          feedback: 'Snape cross eval attempt'
        })
      });
      console.log(`Cross-Hackathon evaluation status: ${badCrossEvalRes.status} (Expected: 403)`);
      if (badCrossEvalRes.status !== 403) {
        throw new Error('Assigned Judge of Hackathon A allowed to evaluate Hackathon B submission!');
      }

      // Step 10: Student Harry checks scorecard
      console.log('\n--- Step 10: Student Harry checks Scorecard for Dynamic Criteria ---');
      const mySubRes = await fetch(`${BASE_URL}/hackathons/${hackAId}/submissions/my-submission`, {
        method: 'GET',
        headers: { 'Cookie': stud1Cookie }
      });
      const mySubData = await mySubRes.json();
      const evalRpt = mySubData.data.submission.evaluations[0];
      console.log(`Retrieved Scorecard Criteria Scores:`);
      evalRpt.criteriaScores.forEach(cs => {
        console.log(` - ${cs.criteria}: ${cs.score}/${cs.maxScore}`);
      });

      const activeCriteria = evalRpt.criteriaScores.map(cs => cs.criteria);
      if (activeCriteria.includes('Potion Code') && activeCriteria.includes('Spell Design')) {
        console.log('\n✅ E2E SUBMISSIONS & EVALUATIONS WORKFLOW VERIFIED SUCCESSFULLY!');
      } else {
        throw new Error('Roster mismatch or dynamic criteria evaluation mismatch!');
      }

    } catch (err) {
      console.error('\n❌ E2E submissions test failed:', err.message);
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

runSubmissionsE2ETest();
