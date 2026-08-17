require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const ProfessorProfile = require('./models/ProfessorProfile');
const Quiz = require('./models/Quiz');
const Question = require('./models/Question');

const PORT = 5090;
let server;

const runTests = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/campushub_quiz_test');
    console.log('Connected to test database');
    
    // Clean test database
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await ProfessorProfile.deleteMany({});
    await Quiz.deleteMany({});
    await Question.deleteMany({});
    console.log('Cleaned test database collections');

    server = app.listen(PORT, async () => {
      console.log(`Quiz test server running on port ${PORT}`);
      try {
        await executeQuizTestSteps();
      } catch (err) {
        console.error('Quiz Test Steps Failed:', err);
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

const executeQuizTestSteps = async () => {
  const authUrl = `http://localhost:${PORT}/api/v1/auth`;
  const quizUrl = `http://localhost:${PORT}/api/v1/quizzes`;
  const questionUrl = `http://localhost:${PORT}/api/v1/questions`;
  const dashboardUrl = `http://localhost:${PORT}/api/v1/dashboard`;

  // --- Test 1: Register Student & Professor ---
  console.log('\n--- Test 1: Registering Student and Professor ---');
  
  const studentPayload = {
    name: 'Student Jack',
    email: 'jack@example.com',
    password: 'password123',
    role: 'student',
    universityId: 'STUD888',
    department: 'Software Engineering',
    year: 2
  };
  
  const profPayload = {
    name: 'Professor Snape',
    email: 'snape@hogwarts.edu',
    password: 'potions_master',
    role: 'professor',
    department: 'Potions'
  };

  const regStudent = await fetch(`${authUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentPayload)
  });
  const regStudentData = await regStudent.json();
  if (regStudent.status !== 201) throw new Error(`Student reg failed: ${JSON.stringify(regStudentData)}`);

  const regProf = await fetch(`${authUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profPayload)
  });
  const regProfData = await regProf.json();
  if (regProf.status !== 201) throw new Error(`Prof reg failed: ${JSON.stringify(regProfData)}`);

  console.log('Registered student and professor successfully');

  // Extract cookies
  let studentCookie = '';
  const studCookies = regStudent.headers.get('set-cookie');
  if (studCookies) {
    const match = studCookies.match(/token=([^;]+)/);
    if (match) studentCookie = match[0];
  }

  let profCookie = '';
  const profCookies = regProf.headers.get('set-cookie');
  if (profCookies) {
    const match = profCookies.match(/token=([^;]+)/);
    if (match) profCookie = match[0];
  }

  // --- Test 2: Professor Creates a Quiz ---
  console.log('\n--- Test 2: Professor Creates a Quiz ---');
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const quizPayload = {
    title: 'Potions Midterm',
    description: 'Advanced brewing methods',
    duration: 45,
    startTime: now.toISOString(),
    endTime: tomorrow.toISOString(),
    totalMarks: 50,
    passingMarks: 20
  };

  const createQuizRes = await fetch(quizUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': profCookie
    },
    body: JSON.stringify(quizPayload)
  });
  const createQuizData = await createQuizRes.json();
  if (createQuizRes.status !== 201) throw new Error(`Quiz creation failed: ${JSON.stringify(createQuizData)}`);
  
  const quizId = createQuizData.data.quiz._id;
  console.log('Quiz created successfully with ID:', quizId);

  // --- Test 3: Professor Adds Questions to the Quiz ---
  console.log('\n--- Test 3: Professor Adds MCQ and T/F Questions ---');
  const q1Payload = {
    type: 'mcq',
    text: 'What is the key ingredient in Draught of Peace?',
    options: ['Powdered moonstone', 'Valerian sprigs', 'Boomslang skin', 'Fluxweed'],
    correctAnswers: [0, 1], // moonstone and valerian
    marks: 5
  };

  const q2Payload = {
    type: 'true_false',
    text: 'Amortentia creates actual love.',
    correctAnswers: [1], // False (index 1)
    marks: 5
  };

  // Add question 1
  const q1Res = await fetch(`${quizUrl}/${quizId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': profCookie },
    body: JSON.stringify(q1Payload)
  });
  const q1Data = await q1Res.json();
  if (q1Res.status !== 201) throw new Error(`Q1 creation failed: ${JSON.stringify(q1Data)}`);

  // Add question 2
  const q2Res = await fetch(`${quizUrl}/${quizId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': profCookie },
    body: JSON.stringify(q2Payload)
  });
  const q2Data = await q2Res.json();
  if (q2Res.status !== 201) throw new Error(`Q2 creation failed: ${JSON.stringify(q2Data)}`);
  
  console.log('MCQ and True/False questions added successfully');

  // --- Test 4: Student Tries to Fetch Unpublished Quiz ---
  console.log('\n--- Test 4: Student Fetches Unpublished Quiz (Should be Blocked) ---');
  const getUnpubQuizRes = await fetch(`${quizUrl}/${quizId}`, {
    method: 'GET',
    headers: { 'Cookie': studentCookie }
  });
  const getUnpubQuizData = await getUnpubQuizRes.json();
  if (getUnpubQuizRes.status !== 403) {
    throw new Error(`Student should have been blocked, but got status ${getUnpubQuizRes.status}`);
  }
  console.log('Student successfully blocked from unpublished quiz (Status 403):', getUnpubQuizData.message);

  // --- Test 5: Professor Publishes Quiz ---
  console.log('\n--- Test 5: Professor Publishes the Quiz ---');
  const pubRes = await fetch(`${quizUrl}/${quizId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': profCookie },
    body: JSON.stringify({ isPublished: true })
  });
  const pubData = await pubRes.json();
  if (pubRes.status !== 200 || !pubData.data.quiz.isPublished) {
    throw new Error(`Publish failed: ${JSON.stringify(pubData)}`);
  }
  console.log('Quiz published successfully');

  // --- Test 6: Student Fetches Published Quiz (Should project/hide correctAnswers) ---
  console.log('\n--- Test 6: Student Fetches Published Quiz Details (RBAC + DTO Check) ---');
  const getPubQuizRes = await fetch(`${quizUrl}/${quizId}`, {
    method: 'GET',
    headers: { 'Cookie': studentCookie }
  });
  const getPubQuizData = await getPubQuizRes.json();
  if (getPubQuizRes.status !== 200) {
    throw new Error(`Student quiz fetch failed: ${JSON.stringify(getPubQuizData)}`);
  }
  
  const studentQuestions = getPubQuizData.data.questions;
  studentQuestions.forEach(q => {
    if (q.correctAnswers !== undefined) {
      throw new Error(`Security Violation: correctAnswers was exposed to student in question: ${q.text}`);
    }
  });
  console.log('Student fetched quiz details successfully. Correct answers successfully HIDDEN from DTO payload!');

  // --- Test 7: Student attempts to add question (Should fail) ---
  console.log('\n--- Test 7: Student Attempts to Add Question (Should be Blocked) ---');
  const studentAddQRes = await fetch(`${quizUrl}/${quizId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
    body: JSON.stringify(q2Payload)
  });
  const studentAddQData = await studentAddQRes.json();
  if (studentAddQRes.status !== 403) {
    throw new Error(`Student add question should have been blocked, but got status ${studentAddQRes.status}`);
  }
  console.log('Student successfully blocked from adding question (Status 403):', studentAddQData.message);

  // --- Test 8: Dashboards Access Control ---
  console.log('\n--- Test 8: Verifying Dashboard RBAC Routing ---');
  
  // Student dashboard with professor cookie (Should fail)
  const profOnStudDashRes = await fetch(`${dashboardUrl}/student`, {
    method: 'GET',
    headers: { 'Cookie': profCookie }
  });
  if (profOnStudDashRes.status !== 403) {
    throw new Error(`Professor should be blocked from student dashboard, but got status ${profOnStudDashRes.status}`);
  }
  console.log('Professor successfully blocked from Student Dashboard');

  // Student dashboard with student cookie (Should succeed)
  const studOnStudDashRes = await fetch(`${dashboardUrl}/student`, {
    method: 'GET',
    headers: { 'Cookie': studentCookie }
  });
  const studDashData = await studOnStudDashRes.json();
  if (studOnStudDashRes.status !== 200 || !studDashData.success) {
    throw new Error(`Student fetch student dashboard failed: ${JSON.stringify(studDashData)}`);
  }
  console.log('Student successfully loaded Student Dashboard! Active quizzes found:', studDashData.data.activeQuizzes.length);

  // Professor dashboard with professor cookie (Should succeed)
  const profOnProfDashRes = await fetch(`${dashboardUrl}/professor`, {
    method: 'GET',
    headers: { 'Cookie': profCookie }
  });
  const profDashData = await profOnProfDashRes.json();
  if (profOnProfDashRes.status !== 200 || !profDashData.success) {
    throw new Error(`Professor fetch professor dashboard failed: ${JSON.stringify(profDashData)}`);
  }
  console.log('Professor successfully loaded Professor Dashboard! Total quizzes created:', profDashData.data.statistics.totalQuizzes);

  console.log('\nALL QUIZ & DASHBOARD TESTS PASSED SUCCESSFULLY! 🚀');
};

runTests();
