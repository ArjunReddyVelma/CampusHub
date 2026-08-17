require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const ProfessorProfile = require('./models/ProfessorProfile');
const Quiz = require('./models/Quiz');
const Question = require('./models/Question');
const QuizAttempt = require('./models/QuizAttempt');

const PORT = 5095;
let server;

const runTests = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/campushub_attempts_test');
    console.log('Connected to attempts test database');
    
    // Clean test database
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await ProfessorProfile.deleteMany({});
    await Quiz.deleteMany({});
    await Question.deleteMany({});
    await QuizAttempt.deleteMany({});
    console.log('Cleaned test database collections');

    server = app.listen(PORT, async () => {
      console.log(`Attempts test server running on port ${PORT}`);
      try {
        await executeAttemptsTestSteps();
      } catch (err) {
        console.error('Attempts Test Steps Failed:', err);
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

const executeAttemptsTestSteps = async () => {
  const authUrl = `http://localhost:${PORT}/api/v1/auth`;
  const quizUrl = `http://localhost:${PORT}/api/v1/quizzes`;
  const attemptsUrl = `http://localhost:${PORT}/api/v1/attempts`;

  // --- Step 1: Register Student & Professor ---
  console.log('\n--- Test 1: Registering Student and Professor ---');
  
  const studentPayload = {
    name: 'Student Harry',
    email: 'harry@example.com',
    password: 'password123',
    role: 'student',
    universityId: 'STUD999',
    department: 'Gryffindor',
    year: 1
  };
  
  const profPayload = {
    name: 'Professor Lupin',
    email: 'lupin@hogwarts.edu',
    password: 'defense_master',
    role: 'professor',
    department: 'Defense Against the Dark Arts'
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

  // --- Step 2: Professor Creates a Quiz with Negative Marking & 2 attempts allowed ---
  console.log('\n--- Test 2: Creating Quiz (Attempts: 2, Negative Marking: 50%) ---');
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const quizPayload = {
    title: 'Boggarts & Werewolves',
    description: 'Defense techniques',
    duration: 1, // 1 minute
    startTime: now.toISOString(),
    endTime: tomorrow.toISOString(),
    totalMarks: 20,
    passingMarks: 10,
    attemptsAllowed: 2,
    negativeMarking: true,
    negativeMarkPercent: 50 // Deducts 50% of question marks on wrong answers
  };

  const createQuizRes = await fetch(quizUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': profCookie },
    body: JSON.stringify(quizPayload)
  });
  const createQuizData = await createQuizRes.json();
  const quizId = createQuizData.data.quiz._id;

  // Add MCQ Question (Marks: 10)
  const q1Res = await fetch(`${quizUrl}/${quizId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': profCookie },
    body: JSON.stringify({
      type: 'mcq',
      text: 'Which spell repels a Boggart?',
      options: ['Riddikulus', 'Expelliarmus', 'Lumos', 'Nox'],
      correctAnswers: [0], // Riddikulus
      marks: 10
    })
  });
  const q1Data = await q1Res.json();
  const q1Id = q1Data.data.question._id;

  // Add True/False Question (Marks: 10)
  const q2Res = await fetch(`${quizUrl}/${quizId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': profCookie },
    body: JSON.stringify({
      type: 'true_false',
      text: 'A werewolf responds only to the call of its own kind.',
      correctAnswers: [0], // True
      marks: 10
    })
  });
  const q2Data = await q2Res.json();
  const q2Id = q2Data.data.question._id;

  // Publish Quiz
  await fetch(`${quizUrl}/${quizId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': profCookie },
    body: JSON.stringify({ isPublished: true })
  });
  console.log('Quiz and questions set up and published');

  // --- Step 3: Student Starts Attempt 1 ---
  console.log('\n--- Test 3: Student Starts Attempt 1 ---');
  const startRes = await fetch(`${quizUrl}/${quizId}/attempts`, {
    method: 'POST',
    headers: { 'Cookie': studentCookie }
  });
  const startData = await startRes.json();
  if (startRes.status !== 201) throw new Error(`Start attempt failed: ${JSON.stringify(startData)}`);
  
  const attemptId = startData.data.attempt._id;
  console.log('Attempt 1 started successfully with ID:', attemptId);

  // --- Step 4: Resume Attempt 1 (Should return same attempt) ---
  console.log('\n--- Test 4: Verifying Resume of Active Attempt ---');
  const resumeRes = await fetch(`${quizUrl}/${quizId}/attempts`, {
    method: 'POST',
    headers: { 'Cookie': studentCookie }
  });
  const resumeData = await resumeRes.json();
  if (resumeRes.status !== 200 || resumeData.data.attempt._id !== attemptId) {
    throw new Error(`Resume failed: ${JSON.stringify(resumeData)}`);
  }
  console.log('Resume check passed: returned identical attempt ID');

  // --- Step 5: Submit Attempt 1 (Correct Answers -> 20 Marks) ---
  console.log('\n--- Test 5: Submitting Attempt 1 (100% Correct answers) ---');
  const submitRes = await fetch(`${attemptsUrl}/${attemptId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
    body: JSON.stringify({
      answers: [
        { question: q1Id, selectedAnswers: [0] }, // Correct
        { question: q2Id, selectedAnswers: [0] }  // Correct
      ]
    })
  });
  const submitData = await submitRes.json();
  if (submitRes.status !== 200 || !submitData.success) {
    throw new Error(`Submit failed: ${JSON.stringify(submitData)}`);
  }
  
  const score1 = submitData.data.attempt.score;
  const isPassed1 = submitData.data.attempt.isPassed;
  if (score1 !== 20 || !isPassed1) {
    throw new Error(`Incorrect scoring logic. Expected 20, got: ${score1}. Expected Passed: true, got: ${isPassed1}`);
  }
  console.log(`Attempt 1 submitted and graded! Score: ${score1}/20, Passed: ${isPassed1}`);

  // --- Step 6: Start Attempt 2 (Negative Marking Calculation) ---
  console.log('\n--- Test 6: Starting Attempt 2 for Negative Marking evaluation ---');
  const start2Res = await fetch(`${quizUrl}/${quizId}/attempts`, {
    method: 'POST',
    headers: { 'Cookie': studentCookie }
  });
  const start2Data = await start2Res.json();
  if (start2Res.status !== 201) throw new Error(`Start attempt 2 failed: ${JSON.stringify(start2Data)}`);
  
  const attempt2Id = start2Data.data.attempt._id;

  // Submit wrong answers (Q1: correct, Q2: wrong).
  // Expected Score: Q1 correct = 10, Q2 incorrect = 10 * (-50%) = -5 penalty. Total = 5 marks.
  console.log('\n--- Test 7: Submitting Attempt 2 (1 correct, 1 wrong -> Expect 5 marks due to negative marking) ---');
  const submit2Res = await fetch(`${attemptsUrl}/${attempt2Id}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
    body: JSON.stringify({
      answers: [
        { question: q1Id, selectedAnswers: [0] }, // Correct (10 marks)
        { question: q2Id, selectedAnswers: [1] }  // Incorrect (-5 penalty)
      ]
    })
  });
  const submit2Data = await submit2Res.json();
  const score2 = submit2Data.data.attempt.score;
  const isPassed2 = submit2Data.data.attempt.isPassed;

  if (score2 !== 5 || isPassed2 !== false) {
    throw new Error(`Scoring calculation error. Expected 5, got: ${score2}. Expected Passed: false, got: ${isPassed2}`);
  }
  console.log(`Attempt 2 evaluated! Score: ${score2}/20, Passed: ${isPassed2}`);

  // --- Step 7: Attempt 3 start (Should be blocked - limit reached) ---
  console.log('\n--- Test 8: Trying to Start Attempt 3 (Should be Blocked) ---');
  const start3Res = await fetch(`${quizUrl}/${quizId}/attempts`, {
    method: 'POST',
    headers: { 'Cookie': studentCookie }
  });
  const start3Data = await start3Res.json();
  if (start3Res.status !== 400 || start3Data.success) {
    throw new Error(`Attempt 3 should be blocked, but got status ${start3Res.status}`);
  }
  console.log('Attempt 3 successfully blocked (Status 400):', start3Data.message);

  // --- Step 8: Expiration check (Resuming expired attempt should auto-submit it) ---
  console.log('\n--- Test 9: Mocking and Resuming an Expired in-progress attempt ---');
  // Register a second student to test this scenario
  const student2Payload = {
    name: 'Student Ron',
    email: 'ron@example.com',
    password: 'password123',
    role: 'student',
    universityId: 'STUD007',
    department: 'Gryffindor',
    year: 1
  };
  const regStudent2 = await fetch(`${authUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student2Payload)
  });
  let student2Cookie = '';
  const stud2Cookies = regStudent2.headers.get('set-cookie');
  if (stud2Cookies) {
    const match = stud2Cookies.match(/token=([^;]+)/);
    if (match) student2Cookie = match[0];
  }

  // Start attempt for student 2
  const ronStartRes = await fetch(`${quizUrl}/${quizId}/attempts`, {
    method: 'POST',
    headers: { 'Cookie': student2Cookie }
  });
  const ronStartData = await ronStartRes.json();
  const ronAttemptId = ronStartData.data.attempt._id;

  // Let's modify the startedAt timestamp of Ron's attempt in the database directly to mock a past start time
  // duration is 1 min, so setting startedAt to 2 mins ago will exceed the limit!
  const pastDate = new Date(Date.now() - 2 * 60 * 1000 - 30000); // 2.5 minutes ago
  await QuizAttempt.findByIdAndUpdate(ronAttemptId, { startedAt: pastDate });
  console.log('Directly updated attempt startedAt to 2.5 minutes in the past');

  // Now, student 2 requests starting/resuming the attempt. The backend should notice the expiration,
  // evaluate whatever they have saved, mark status as 'expired', and because attempt limit is 2,
  // allow starting a new attempt if they request it again.
  const ronResumeRes = await fetch(`${quizUrl}/${quizId}/attempts`, {
    method: 'POST',
    headers: { 'Cookie': student2Cookie }
  });
  const ronResumeData = await ronResumeRes.json();
  
  // The backend should return the new attempt created, or notice expiration and close it!
  // In our logic:
  // "if (elapsedMs > limitMs + 15000) { activeAttempt.status = 'expired'; await evaluateAttempt(...); await activeAttempt.save(); ... Create new attempt ... }"
  // So the response should be status 201 (started a new attempt!) and the old one should now be 'expired' in DB!
  if (ronResumeRes.status !== 201) {
    throw new Error(`Expected a new attempt to start after old one expired, but got status ${ronResumeRes.status}: ${JSON.stringify(ronResumeData)}`);
  }
  
  // Verify in database that the old attempt is indeed marked as 'expired'
  const oldAttemptObj = await QuizAttempt.findById(ronAttemptId);
  if (oldAttemptObj.status !== 'expired') {
    throw new Error(`Expected old attempt status to be 'expired', but got: ${oldAttemptObj.status}`);
  }
  console.log('Expiration check passed! Old attempt successfully auto-expired in DB, and new attempt started successfully!');

  console.log('\nALL ATTEMPT & SCORING TESTS PASSED SUCCESSFULLY! 🚀');
};

runTests();
