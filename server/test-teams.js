require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const ProfessorProfile = require('./models/ProfessorProfile');
const Club = require('./models/Club');
const Hackathon = require('./models/Hackathon');
const Team = require('./models/Team');
const TeamInvitation = require('./models/TeamInvitation');

const PORT = 5102;
let server;

const runTests = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/campushub_teams_test');
    console.log('Connected to teams test database');
    
    // Clean test database
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await ProfessorProfile.deleteMany({});
    await Club.deleteMany({});
    await Hackathon.deleteMany({});
    await Team.deleteMany({});
    await TeamInvitation.deleteMany({});
    console.log('Cleaned test database collections');

    server = app.listen(PORT, async () => {
      console.log(`Teams test server running on port ${PORT}`);
      try {
        await executeTeamsTestSteps();
      } catch (err) {
        console.error('Teams Test Steps Failed:', err);
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

const executeTeamsTestSteps = async () => {
  const authUrl = `http://localhost:${PORT}/api/v1/auth`;
  const hackathonsUrl = `http://localhost:${PORT}/api/v1/hackathons`;
  const teamsUrl = `http://localhost:${PORT}/api/v1/teams`;
  const invitesUrl = `http://localhost:${PORT}/api/v1/team-invitations`;

  // --- Step 1: Set up Users ---
  console.log('\n--- Test 1: Registering 3 Students and 1 Club Admin ---');
  
  const student1 = {
    name: 'Harry Potter',
    email: 'harry@hogwarts.edu',
    password: 'password123',
    role: 'student',
    universityId: 'STUD001',
    department: 'Gryffindor',
    year: 1
  };
  
  const student2 = {
    name: 'Ron Weasley',
    email: 'ron@hogwarts.edu',
    password: 'password123',
    role: 'student',
    universityId: 'STUD002',
    department: 'Gryffindor',
    year: 1
  };
  
  const student3 = {
    name: 'Hermione Granger',
    email: 'hermione@hogwarts.edu',
    password: 'password123',
    role: 'student',
    universityId: 'STUD003',
    department: 'Gryffindor',
    year: 1
  };

  const clubAdmin = await User.create({
    name: 'Gryffindor Organizer',
    email: 'organizer@campushub.edu',
    password: 'password123',
    role: 'club_admin'
  });

  const regS1 = await fetch(`${authUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student1)
  });
  if (regS1.status !== 201) {
    const errorData = await regS1.json();
    throw new Error(`Harry registration failed: ${JSON.stringify(errorData)}`);
  }

  const regS2 = await fetch(`${authUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student2)
  });
  if (regS2.status !== 201) {
    const errorData = await regS2.json();
    throw new Error(`Ron registration failed: ${JSON.stringify(errorData)}`);
  }

  const regS3 = await fetch(`${authUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student3)
  });
  if (regS3.status !== 201) {
    const errorData = await regS3.json();
    throw new Error(`Hermione registration failed: ${JSON.stringify(errorData)}`);
  }

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
  const hrCookie = await getCookie('hermione@hogwarts.edu', 'password123');

  console.log('Students registered and authenticated successfully');

  // --- Step 2: Seed Club and Hackathon directly ---
  console.log('\n--- Test 2: Seeding Approved Club and Published Hackathon ---');
  const club = await Club.create({
    name: 'Gryffindor Quidditch Club',
    description: 'Flying and catching the snitch',
    category: 'Sports',
    owner: clubAdmin._id,
    status: 'approved'
  });

  const now = new Date();
  const startDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
  const endDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
  const hackathon = await Hackathon.create({
    club: club._id,
    title: 'Hogwarts Interhouse Hackathon',
    description: 'Magical coding solutions',
    problemStatement: 'Automate the sorting hat',
    startDate,
    endDate,
    registrationDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
    submissionDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    minTeamSize: 2,
    maxTeamSize: 3,
    isPublished: true
  });
  console.log('Hackathon created with ID:', hackathon._id);

  // --- Step 3: Student 1 Creates Team ---
  console.log('\n--- Test 3: Harry Creates Team "Gryffindor Coders" ---');
  const createTeamRes = await fetch(`${hackathonsUrl}/${hackathon._id}/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': hCookie },
    body: JSON.stringify({
      name: 'Gryffindor Coders',
      description: 'The golden trio of developers'
    })
  });
  const createTeamData = await createTeamRes.json();
  if (createTeamRes.status !== 201) throw new Error(`Team creation failed: ${JSON.stringify(createTeamData)}`);
  
  const teamId = createTeamData.data.team._id;
  console.log(`Team created successfully (ID: ${teamId}, Status: ${createTeamData.data.team.status})`);

  // --- Step 4: Student 1 tries to create another team (Should fail) ---
  console.log('\n--- Test 4: Harry attempts to register a second team (Should be Blocked) ---');
  const createTeam2Res = await fetch(`${hackathonsUrl}/${hackathon._id}/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': hCookie },
    body: JSON.stringify({ name: 'Potter Coders' })
  });
  const createTeam2Data = await createTeam2Res.json();
  if (createTeam2Res.status !== 400 || createTeam2Data.success) {
    throw new Error(`Second team registration should have failed, got status ${createTeam2Res.status}`);
  }
  console.log('Second team creation successfully blocked (Status 400):', createTeam2Data.message);

  // --- Step 5: Student 1 Invites Student 2 and Student 3 ---
  console.log('\n--- Test 5: Harry Invites Ron and Hermione to the Team ---');
  
  // Invite Ron
  const inviteRonRes = await fetch(`${teamsUrl}/${teamId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': hCookie },
    body: JSON.stringify({ inviteeEmail: 'ron@hogwarts.edu' })
  });
  const inviteRonData = await inviteRonRes.json();
  if (inviteRonRes.status !== 201) throw new Error(`Ron invite failed: ${JSON.stringify(inviteRonData)}`);
  const ronInviteId = inviteRonData.data.invitation._id;

  // Invite Hermione
  const inviteHermioneRes = await fetch(`${teamsUrl}/${teamId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': hCookie },
    body: JSON.stringify({ inviteeEmail: 'hermione@hogwarts.edu' })
  });
  const inviteHermioneData = await inviteHermioneRes.json();
  if (inviteHermioneRes.status !== 201) throw new Error(`Hermione invite failed: ${JSON.stringify(inviteHermioneData)}`);
  const hermioneInviteId = inviteHermioneData.data.invitation._id;

  console.log('Invitations sent successfully');

  // --- Step 6: Student 2 Accepts invitation ---
  console.log('\n--- Test 6: Ron Accepts Invitation ---');
  const acceptRonRes = await fetch(`${invitesUrl}/${ronInviteId}/accept`, {
    method: 'POST',
    headers: { 'Cookie': rCookie }
  });
  const acceptRonData = await acceptRonRes.json();
  if (acceptRonRes.status !== 200 || !acceptRonData.success) {
    throw new Error(`Ron accept failed: ${JSON.stringify(acceptRonData)}`);
  }
  console.log('Ron successfully joined the team');

  // --- Step 7: Student 3 Rejects invitation ---
  console.log('\n--- Test 7: Hermione Rejects Invitation ---');
  const rejectHermioneRes = await fetch(`${invitesUrl}/${hermioneInviteId}/reject`, {
    method: 'POST',
    headers: { 'Cookie': hrCookie }
  });
  const rejectHermioneData = await rejectHermioneRes.json();
  if (rejectHermioneRes.status !== 200 || !rejectHermioneData.success) {
    throw new Error(`Hermione reject failed: ${JSON.stringify(rejectHermioneData)}`);
  }
  console.log('Hermione successfully declined invitation');

  // --- Step 8: Student 2 leaves the team ---
  console.log('\n--- Test 8: Ron Leaves the Team ---');
  const leaveRes = await fetch(`${teamsUrl}/${teamId}/leave`, {
    method: 'POST',
    headers: { 'Cookie': rCookie }
  });
  const leaveData = await leaveRes.json();
  if (leaveRes.status !== 200 || !leaveData.success) {
    throw new Error(`Ron leave failed: ${JSON.stringify(leaveData)}`);
  }
  console.log('Ron left the team successfully');

  // --- Step 9: Re-invite Ron and accept again ---
  console.log('\n--- Test 9: Re-inviting and Re-accepting Ron ---');
  
  const reInviteRes = await fetch(`${teamsUrl}/${teamId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': hCookie },
    body: JSON.stringify({ inviteeEmail: 'ron@hogwarts.edu' })
  });
  const reInviteData = await reInviteRes.json();
  const newInviteId = reInviteData.data.invitation._id;

  await fetch(`${invitesUrl}/${newInviteId}/accept`, {
    method: 'POST',
    headers: { 'Cookie': rCookie }
  });
  console.log('Ron re-joined the team successfully');

  // --- Step 10: Leader removes Student 2 ---
  console.log('\n--- Test 10: Harry Removes Ron from the Team ---');
  const ronUserObj = await User.findOne({ email: 'ron@hogwarts.edu' });
  
  const removeRes = await fetch(`${teamsUrl}/${teamId}/members/${ronUserObj._id}/remove`, {
    method: 'POST',
    headers: { 'Cookie': hCookie }
  });
  const removeData = await removeRes.json();
  if (removeRes.status !== 200 || !removeData.success) {
    throw new Error(`Remove member failed: ${JSON.stringify(removeData)}`);
  }
  
  // Verify Ron is no longer in team members list
  const updatedTeam = await Team.findById(teamId);
  if (updatedTeam.members.includes(ronUserObj._id)) {
    throw new Error('Ron was not removed from the database members list');
  }
  console.log('Ron successfully removed from the team by Leader Harry');

  console.log('\nALL TEAM WORKFLOW TESTS PASSED SUCCESSFULLY! 🚀');
};

runTests();
