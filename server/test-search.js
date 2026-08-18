require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const User = require('./models/User');
const Club = require('./models/Club');
const Hackathon = require('./models/Hackathon');

const PORT = 5111;
let server;

const runTests = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/campushub_search_test');
    console.log('Connected to search test database');
    
    // Clean test database
    await User.deleteMany({});
    await Club.deleteMany({});
    await Hackathon.deleteMany({});
    await Hackathon.ensureIndexes();
    console.log('Cleaned test database collections and ensured indexes');

    server = app.listen(PORT, async () => {
      console.log(`Search test server running on port ${PORT}`);
      try {
        await executeSearchTestSteps();
      } catch (err) {
        console.error('Search Test Steps Failed:', err);
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

const executeSearchTestSteps = async () => {
  const hackathonsUrl = `http://localhost:${PORT}/api/v1/hackathons`;

  // --- Step 1: Seed Club and Hackathons ---
  const clubAdmin = await User.create({
    name: 'Club Owner',
    email: 'owner@campushub.edu',
    password: 'password123',
    role: 'club_admin'
  });

  const club = await Club.create({
    name: 'Technical Coding Club',
    description: 'We host challenges',
    category: 'Technical',
    owner: clubAdmin._id,
    status: 'approved'
  });

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const h1 = await Hackathon.create({
    club: club._id,
    title: 'Deep Learning Vision Challenge',
    description: 'Build neural network models for computer vision tasks',
    problemStatement: 'Classify medical imaging scans',
    startDate: new Date(now.getTime() + 10 * 60 * 1000),
    endDate: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    registrationDeadline: new Date(now.getTime() + 2 * 60 * 1000),
    submissionDeadline: new Date(now.getTime() + 1 * 60 * 60 * 1000),
    isPublished: true
  });

  const h2 = await Hackathon.create({
    club: club._id,
    title: 'Fullstack Express Web Sprint',
    description: 'Create scalable REST APIs and connect them to React frontend',
    problemStatement: 'Create university portal REST API',
    startDate: new Date(now.getTime() + 10 * 60 * 1000),
    endDate: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    registrationDeadline: new Date(now.getTime() + 2 * 60 * 1000),
    submissionDeadline: new Date(now.getTime() + 1 * 60 * 60 * 1000),
    isPublished: true
  });

  console.log('Seeded 2 published hackathons');

  // --- Step 2: Search for "neural" (Should match Deep Learning hackathon) ---
  console.log('\n--- Test 1: Searching for "neural" ---');
  const res1 = await fetch(`${hackathonsUrl}?search=neural`);
  const data1 = await res1.json();
  
  if (data1.data.hackathons.length !== 1 || data1.data.hackathons[0].title !== 'Deep Learning Vision Challenge') {
    throw new Error(`Search failed for "neural". Got: ${JSON.stringify(data1)}`);
  }
  console.log('Search for "neural" successfully returned ONLY the Deep Learning hackathon!');

  // --- Step 3: Search for "Express" (Should match Fullstack hackathon) ---
  console.log('\n--- Test 2: Searching for "Express" ---');
  const res2 = await fetch(`${hackathonsUrl}?search=Express`);
  const data2 = await res2.json();
  
  if (data2.data.hackathons.length !== 1 || data2.data.hackathons[0].title !== 'Fullstack Express Web Sprint') {
    throw new Error(`Search failed for "Express". Got: ${JSON.stringify(data2)}`);
  }
  console.log('Search for "Express" successfully returned ONLY the Fullstack hackathon!');

  console.log('\nALL FULL-TEXT SEARCH TESTS PASSED SUCCESSFULLY! 🚀');
};

runTests();
