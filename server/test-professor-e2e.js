const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');

// Require server database connections and model registries
const connectDB = require('./config/db');
const User = require('./models/User');
const Quiz = require('./models/Quiz');
const Question = require('./models/Question');
const QuizAttempt = require('./models/QuizAttempt');
const StudentProfile = require('./models/StudentProfile');

const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const questionRoutes = require('./routes/questionRoutes');
const attemptRoutes = require('./routes/attemptRoutes');

const errorHandler = require('./middleware/error');

const PORT = 5120;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

// Helper to extract cookies from response set-cookie header
const getCookieHeader = (res) => {
  const cookies = res.headers.get('set-cookie');
  return cookies ? cookies.split(',').map(c => c.split(';')[0]).join('; ') : '';
};

const runE2ETest = async () => {
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/campushub_prof_e2e';
  process.env.JWT_SECRET = 'e2esecret12345';
  process.env.JWT_EXPIRE = '1h';

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Prof E2E test database');
    
    // Clean old records
    await User.deleteMany({});
    await Quiz.deleteMany({});
    await Question.deleteMany({});
    await QuizAttempt.deleteMany({});
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
  app.use('/api/v1/quizzes', quizRoutes);
  app.use('/api/v1/questions', questionRoutes);
  app.use('/api/v1/attempts', attemptRoutes);

  app.use(errorHandler);

  const server = app.listen(PORT, async () => {
    console.log(`E2E Test server running on port ${PORT}`);

    let profCookie = '';
    let studCookie = '';

    try {
      // Step 1: Register and login Professor
      console.log('\n--- Step 1: Registering Professor ---');
      const profRegRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Professor Snape',
          email: 'snape@hogwarts.edu',
          password: 'potionsclass',
          role: 'professor',
          department: 'Potions'
        })
      });
      profCookie = getCookieHeader(profRegRes);
      console.log('Professor registered & authenticated');

      // Step 2: Create a Quiz
      console.log('\n--- Step 2: Creating Quiz (Draft Mode) ---');
      const quizCreateRes = await fetch(`${BASE_URL}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': profCookie
        },
        body: JSON.stringify({
          title: 'Potions Midterm',
          description: 'Advanced brewing techniques assessment',
          duration: 10,
          startTime: new Date(Date.now() - 5000), // starts now
          endTime: new Date(Date.now() + 600000),  // ends in 10 mins
          totalMarks: 30,
          passingMarks: 15,
          attemptsAllowed: 1
        })
      });
      const quizCreateData = await quizCreateRes.json();
      const quizId = quizCreateData.data.quiz._id;
      console.log(`Quiz created with ID: ${quizId}`);

      // Step 3: Add 3 Questions
      console.log('\n--- Step 3: Adding 3 Questions ---');
      const q1Res = await fetch(`${BASE_URL}/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': profCookie
        },
        body: JSON.stringify({
          type: 'mcq',
          text: 'What is the main ingredient of Polyjuice Potion?',
          options: ['Fluxweed', 'Boomslang Skin', 'Lacewing Flies', 'Bicorn Horn'],
          correctAnswers: [2],
          marks: 10
        })
      });
      const q1 = await q1Res.json();
      console.log('Added MCQ Question 1');

      const q2Res = await fetch(`${BASE_URL}/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': profCookie
        },
        body: JSON.stringify({
          type: 'true_false',
          text: 'Felix Felicis is also known as Liquid Luck.',
          options: ['True', 'False'],
          correctAnswers: [0],
          marks: 10
        })
      });
      const q2 = await q2Res.json();
      console.log('Added True/False Question 2');

      const q3Res = await fetch(`${BASE_URL}/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': profCookie
        },
        body: JSON.stringify({
          type: 'mcq',
          text: 'Which potion causes the drinker to fall into a death-like slumber?',
          options: ['Amortentia', 'Draught of Living Death', 'Veritaserum', 'Skele-Gro'],
          correctAnswers: [1],
          marks: 10
        })
      });
      const q3 = await q3Res.json();
      console.log('Added MCQ Question 3');

      // Step 4: Publish the Quiz
      console.log('\n--- Step 4: Publishing Quiz ---');
      await fetch(`${BASE_URL}/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': profCookie
        },
        body: JSON.stringify({ isPublished: true })
      });
      console.log('Quiz successfully published!');

      // Step 5: Register and login Student
      console.log('\n--- Step 5: Registering Student ---');
      const studRegRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Harry Potter',
          email: 'harry@hogwarts.edu',
          password: 'gryffindorhouse',
          role: 'student',
          department: 'Defense Against the Dark Arts',
          universityId: 'STUD100',
          year: 1
        })
      });
      studCookie = getCookieHeader(studRegRes);
      console.log('Student registered & authenticated');

      // Step 6: Student Starts Attempt
      console.log('\n--- Step 6: Student Starts Attempt ---');
      const startRes = await fetch(`${BASE_URL}/quizzes/${quizId}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': studCookie
        }
      });
      const startData = await startRes.json();
      const attemptId = startData.data.attempt._id;
      console.log(`Student started attempt. ID: ${attemptId}`);

      // Step 7: Student Submits Answers (Let's answer 2 correct, 1 wrong)
      // Q1: Lacewing Flies (Correct -> index 2)
      // Q2: True (Correct -> index 0)
      // Q3: Veritaserum (Wrong -> index 2, correct was Draught of Living Death index 1)
      // Score: 10 + 10 = 20/30. Verdict: Passed (passing score: 15)
      console.log('\n--- Step 7: Student Submits Attempt ---');
      const submitRes = await fetch(`${BASE_URL}/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': studCookie
        },
        body: JSON.stringify({
          answers: [
            { question: q1.data.question._id, selectedAnswers: [2] },
            { question: q2.data.question._id, selectedAnswers: [0] },
            { question: q3.data.question._id, selectedAnswers: [2] }
          ]
        })
      });
      const submitData = await submitRes.json();
      console.log(`Attempt submitted! Graded Score: ${submitData.data.attempt.score}/30. Passed: ${submitData.data.attempt.isPassed}`);

      // Step 8: Professor Inspects Quiz Results List
      console.log('\n--- Step 8: Professor Inspects Results list ---');
      const resultsRes = await fetch(`${BASE_URL}/quizzes/${quizId}/attempts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': profCookie
        }
      });
      const resultsData = await resultsRes.json();
      const studentAttempt = resultsData.data.attempts[0];
      
      console.log('\n--- E2E Verification Details ---');
      console.log(`Found Attempt record for: ${studentAttempt.student.name}`);
      console.log(`Student Email: ${studentAttempt.student.email}`);
      console.log(`Recorded score: ${studentAttempt.score}/30`);
      console.log(`Verdict: ${studentAttempt.isPassed ? 'Passed' : 'Failed'}`);
      console.log(`Status: ${studentAttempt.status}`);

      if (studentAttempt.score === 20 && studentAttempt.isPassed === true && studentAttempt.status === 'submitted') {
        console.log('\n✅ PROFESSOR TO STUDENT END-TO-END WORKFLOW VERIFIED SUCCESSFULLY!');
      } else {
        throw new Error('E2E validation checks failed: attempt data mismatch');
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
