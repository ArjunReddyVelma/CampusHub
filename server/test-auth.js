require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const User = require('./models/User');

const StudentProfile = require('./models/StudentProfile');
const ProfessorProfile = require('./models/ProfessorProfile');

const PORT = 5080;
let server;

const runTests = async () => {
  try {
    // 1. Connect to DB and Start Server
    await mongoose.connect('mongodb://localhost:27017/campushub_test');
    console.log('Connected to test database');
    
    // Clean test database
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await ProfessorProfile.deleteMany({});
    console.log('Cleaned test database collections');

    // Register a test route to verify role authorization blocking
    const { protect, authorize } = require('./middleware/auth');
    app.get('/api/v1/test-prof-route', protect, authorize('professor'), (req, res) => {
      res.status(200).json({ success: true, message: 'Welcome Professor' });
    });

    server = app.listen(PORT, async () => {
      console.log(`Test server running on port ${PORT}`);
      try {
        await executeTestSteps();
      } catch (err) {
        console.error('Test Steps Failed:', err);
        process.exitCode = 1;
      } finally {
        // Shutdown
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

const executeTestSteps = async () => {
  const baseUrl = `http://localhost:${PORT}/api/v1/auth`;

  // --- Test 1: Public Registration of Student ---
  console.log('\n--- Test 1: Registering Student ---');
  const studentPayload = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
    role: 'student',
    universityId: 'STUD12345',
    department: 'Computer Science',
    year: 3
  };

  const regRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentPayload)
  });

  const regData = await regRes.json();
  if (regRes.status !== 201 || !regData.success) {
    throw new Error(`Student registration failed: ${JSON.stringify(regData)}`);
  }
  console.log('Student registered successfully:', regData.message);

  // Extract set-cookie token
  const cookies = regRes.headers.get('set-cookie');
  let tokenCookie = '';
  if (cookies) {
    const match = cookies.match(/token=([^;]+)/);
    if (match) tokenCookie = match[0];
  }
  console.log('Cookie received:', tokenCookie ? 'Yes (token extracted)' : 'No');

  // --- Test 2: Attempting to register Admin (Should block) ---
  console.log('\n--- Test 2: Attempting to Register Admin ---');
  const adminPayload = {
    name: 'Bad Actor',
    email: 'bad@example.com',
    password: 'password123',
    role: 'admin'
  };

  const adminRegRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminPayload)
  });

  const adminRegData = await adminRegRes.json();
  if (adminRegRes.status !== 400 || adminRegData.success) {
    throw new Error(`Admin registration should have failed, but got status ${adminRegRes.status}: ${JSON.stringify(adminRegData)}`);
  }
  console.log('Admin registration successfully blocked (Status 400):', adminRegData.message);

  // --- Test 3: Log In with valid credentials ---
  console.log('\n--- Test 3: Logging In Student ---');
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'jane@example.com',
      password: 'password123'
    })
  });

  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.success) {
    throw new Error(`Student login failed: ${JSON.stringify(loginData)}`);
  }
  console.log('Student logged in successfully:', loginData.message);

  const loginCookies = loginRes.headers.get('set-cookie');
  let loginCookieToken = '';
  if (loginCookies) {
    const match = loginCookies.match(/token=([^;]+)/);
    if (match) loginCookieToken = match[0];
  }

  // --- Test 4: Fetch Profile /me with token ---
  console.log('\n--- Test 4: Fetching Profile /me ---');
  const meRes = await fetch(`${baseUrl}/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': loginCookieToken
    }
  });

  const meData = await meRes.json();
  if (meRes.status !== 200 || !meData.success) {
    throw new Error(`Fetch profile /me failed: ${JSON.stringify(meData)}`);
  }
  console.log('Profile retrieved successfully for:', meData.data.user.name);

  // --- Test 5: Change Password ---
  console.log('\n--- Test 5: Changing Password ---');
  const changePasswordRes = await fetch(`${baseUrl}/change-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': loginCookieToken
    },
    body: JSON.stringify({
      currentPassword: 'password123',
      newPassword: 'newpassword456'
    })
  });

  const changePasswordData = await changePasswordRes.json();
  if (changePasswordRes.status !== 200 || !changePasswordData.success) {
    throw new Error(`Password change failed: ${JSON.stringify(changePasswordData)}`);
  }
  console.log('Password changed successfully:', changePasswordData.message);

  // --- Test 6: Verify login with old password fails ---
  console.log('\n--- Test 6: Verifying Old Password Login Fails ---');
  const oldLoginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'jane@example.com',
      password: 'password123'
    })
  });

  const oldLoginData = await oldLoginRes.json();
  if (oldLoginRes.status !== 401 || oldLoginData.success) {
    throw new Error(`Login with old password should fail, but got status ${oldLoginRes.status}`);
  }
  console.log('Login with old password successfully rejected (Status 401):', oldLoginData.message);

  // --- Test 7: Logging In with New Password ---
  console.log('\n--- Test 7: Logging In with New Password ---');
  const newLoginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'jane@example.com',
      password: 'newpassword456'
    })
  });

  const newLoginData = await newLoginRes.json();
  if (newLoginRes.status !== 200 || !newLoginData.success) {
    throw new Error(`Login with new password failed: ${JSON.stringify(newLoginData)}`);
  }
  console.log('Login with new password succeeded:', newLoginData.message);

  const newLoginCookies = newLoginRes.headers.get('set-cookie');
  let newCookieToken = '';
  if (newLoginCookies) {
    const match = newLoginCookies.match(/token=([^;]+)/);
    if (match) newCookieToken = match[0];
  }

  // --- Test 9: Verify role authorization (Student blocked from Professor route) ---
  console.log('\n--- Test 9: Verifying Student Blocked From Professor Route (RBAC) ---');
  const profRouteRes = await fetch(`http://localhost:${PORT}/api/v1/test-prof-route`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': newCookieToken
    }
  });

  const profRouteData = await profRouteRes.json();
  if (profRouteRes.status !== 403 || profRouteData.success) {
    throw new Error(`Student should have been blocked (403), but got status ${profRouteRes.status}: ${JSON.stringify(profRouteData)}`);
  }
  console.log('Student successfully blocked from Professor route (Status 403):', profRouteData.message);

  // --- Test 8: Logout ---
  console.log('\n--- Test 8: Logging Out ---');
  const logoutRes = await fetch(`${baseUrl}/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': newCookieToken
    }
  });

  const logoutData = await logoutRes.json();
  if (logoutRes.status !== 200 || !logoutData.success) {
    throw new Error(`Logout failed: ${JSON.stringify(logoutData)}`);
  }
  console.log('Logged out successfully:', logoutData.message);
  console.log('\nALL TESTS PASSED SUCCESSFULLY! 🚀');
};

runTests();
