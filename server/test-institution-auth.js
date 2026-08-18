require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const ProfessorProfile = require('./models/ProfessorProfile');

const PORT = 5085;
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
  const authUrl = `http://localhost:${PORT}/api/v1/auth`;
  const adminUrl = `http://localhost:${PORT}/api/v1/admin`;

  // Ensure default environment values
  process.env.ALLOW_PUBLIC_REGISTRATION = 'false';
  process.env.UNIVERSITY_EMAIL_DOMAIN = 'university.edu';

  // --- Test 1: Public Registration is disabled by default (returns 403) ---
  console.log('\n--- Test 1: Public Registration Blocked ---');
  const studentPayload = {
    name: 'Jane Doe',
    email: 'jane@university.edu',
    password: 'password123',
    role: 'student',
    universityId: 'STUD12345',
    department: 'Computer Science',
    year: 3
  };

  const regRes = await fetch(`${authUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentPayload)
  });

  const regData = await regRes.json();
  if (regRes.status !== 403 || regData.success !== false) {
    throw new Error(`Expected registration to be disabled. Status: ${regRes.status}, data: ${JSON.stringify(regData)}`);
  }
  console.log('✓ Public registration was correctly blocked with 403 Forbidden.');

  // --- Test 2: Public Registration works when explicitly allowed ---
  console.log('\n--- Test 2: Public Registration Enabled ---');
  process.env.ALLOW_PUBLIC_REGISTRATION = 'true';

  const regAllowedRes = await fetch(`${authUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentPayload)
  });

  const regAllowedData = await regAllowedRes.json();
  if (regAllowedRes.status !== 201 || !regAllowedData.success) {
    throw new Error(`Expected registration to succeed. Status: ${regAllowedRes.status}, data: ${JSON.stringify(regAllowedData)}`);
  }
  console.log('✓ Public registration succeeded when ALLOW_PUBLIC_REGISTRATION=true.');

  // Clean DB for further tests
  await User.deleteMany({});
  await StudentProfile.deleteMany({});
  process.env.ALLOW_PUBLIC_REGISTRATION = 'false';

  // --- Setup: Seed an Admin directly ---
  const adminUser = await User.create({
    name: 'System Admin',
    email: 'admin@university.edu',
    password: 'password123',
    role: 'admin',
    mustChangePassword: false,
    isActive: true
  });

  // Login as admin to get cookie
  const adminLoginRes = await fetch(`${authUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@university.edu', password: 'password123' })
  });

  const adminCookies = adminLoginRes.headers.get('set-cookie');
  let adminCookie = '';
  if (adminCookies) {
    const match = adminCookies.match(/token=([^;]+)/);
    if (match) adminCookie = match[0];
  }

  // --- Test 3: Admin can create a student account ---
  console.log('\n--- Test 3: Admin Provisioning Student ---');
  const provisionStudentPayload = {
    name: 'Bobby Student',
    email: 'bobby@university.edu',
    password: 'TemporaryPassword123!',
    role: 'student',
    universityId: 'SPSU9001',
    department: 'Software Engineering',
    year: 2
  };

  const createStudentRes = await fetch(`${adminUrl}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify(provisionStudentPayload)
  });

  const createStudentData = await createStudentRes.json();
  if (createStudentRes.status !== 201 || !createStudentData.success) {
    throw new Error(`Expected Student account provisioning to succeed. Status: ${createStudentRes.status}, data: ${JSON.stringify(createStudentData)}`);
  }
  console.log('✓ Student account provisioned successfully.');

  // Verify StudentProfile was created
  const studentProfile = await StudentProfile.findOne({ universityId: 'SPSU9001' });
  if (!studentProfile) {
    throw new Error('StudentProfile document was not found.');
  }
  console.log('✓ StudentProfile was successfully verified in DB.');

  // --- Test 4: Duplicate Email rejected ---
  console.log('\n--- Test 4: Rejects Duplicate Email ---');
  const duplicateEmailRes = await fetch(`${adminUrl}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify(provisionStudentPayload)
  });

  const duplicateEmailData = await duplicateEmailRes.json();
  if (duplicateEmailRes.status !== 400 || duplicateEmailData.success !== false) {
    throw new Error(`Expected duplicate email registration to fail. Status: ${duplicateEmailRes.status}`);
  }
  console.log('✓ Duplicate email was correctly blocked with 400 Bad Request.');

  // --- Test 5: Rejects Invalid Domain ---
  console.log('\n--- Test 5: Rejects Invalid Email Domain ---');
  const invalidDomainPayload = {
    ...provisionStudentPayload,
    email: 'bobby@gmail.com',
    universityId: 'SPSU9002'
  };

  const invalidDomainRes = await fetch(`${adminUrl}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify(invalidDomainPayload)
  });

  const invalidDomainData = await invalidDomainRes.json();
  if (invalidDomainRes.status !== 400 || invalidDomainData.success !== false) {
    throw new Error(`Expected invalid domain registration to fail. Status: ${invalidDomainRes.status}`);
  }
  console.log('✓ Non-university email domain was correctly blocked with 400.');

  // --- Test 6: Rejects Invalid Role ---
  console.log('\n--- Test 6: Rejects Invalid Role Name ---');
  const invalidRolePayload = {
    ...provisionStudentPayload,
    email: 'bobby2@university.edu',
    role: 'super-hacker'
  };

  const invalidRoleRes = await fetch(`${adminUrl}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify(invalidRolePayload)
  });

  const invalidRoleData = await invalidRoleRes.json();
  if (invalidRoleRes.status !== 400 || invalidRoleData.success !== false) {
    throw new Error(`Expected invalid role registration to fail. Status: ${invalidRoleRes.status}`);
  }
  console.log('✓ Invalid role was correctly blocked with 400.');

  // --- Test 7: Non-admin cannot create users ---
  console.log('\n--- Test 7: Blocks Non-Admin from User Provisioning ---');
  const nonAdminRes = await fetch(`${adminUrl}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(provisionStudentPayload)
  });

  const nonAdminData = await nonAdminRes.json();
  if (nonAdminRes.status !== 401) {
    throw new Error(`Expected unauthenticated user to get 401. Status: ${nonAdminRes.status}`);
  }
  console.log('✓ Unauthorized calls were blocked.');

  // --- Test 8: Forced Password Change Flow ---
  console.log('\n--- Test 8: Must Change Password Workflow ---');
  // Login as student
  const studentLoginRes = await fetch(`${authUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bobby@university.edu', password: 'TemporaryPassword123!' })
  });

  const studentCookies = studentLoginRes.headers.get('set-cookie');
  let studentCookie = '';
  if (studentCookies) {
    const match = studentCookies.match(/token=([^;]+)/);
    if (match) studentCookie = match[0];
  }

  // Attempt to hit a protected dashboard endpoint
  const dashboardRes = await fetch(`${adminUrl}/dashboard`, {
    method: 'GET',
    headers: { 'Cookie': studentCookie }
  });

  const dashboardData = await dashboardRes.json();
  if (dashboardRes.status !== 403 || !dashboardData.mustChangePassword) {
    throw new Error(`Expected access to dashboard to be blocked with 403 mustChangePassword. Status: ${dashboardRes.status}, data: ${JSON.stringify(dashboardData)}`);
  }
  console.log('✓ Student was correctly blocked from standard routes before password change.');

  // Change password
  const changePassRes = await fetch(`${authUrl}/change-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': studentCookie
    },
    body: JSON.stringify({ currentPassword: 'TemporaryPassword123!', newPassword: 'NewSecurePassword123!' })
  });

  const changePassData = await changePassRes.json();
  if (changePassRes.status !== 200 || !changePassData.success || changePassData.data.user.mustChangePassword !== false) {
    throw new Error(`Expected password change to succeed and reset flag. Status: ${changePassRes.status}, data: ${JSON.stringify(changePassData)}`);
  }
  console.log('✓ Password changed successfully, mustChangePassword reset to false.');

  // Verify access is now unblocked
  const getMeRes = await fetch(`${authUrl}/me`, {
    method: 'GET',
    headers: { 'Cookie': studentCookie }
  });

  const getMeData = await getMeRes.json();
  if (getMeRes.status !== 200 || getMeData.data.user.mustChangePassword !== false) {
    throw new Error(`Expected access to be permitted. Status: ${getMeRes.status}`);
  }
  console.log('✓ Access to secure endpoints is now successfully unblocked.');

  // --- Test 9: Suspended User Blocked ---
  console.log('\n--- Test 9: Suspended User Cannot Authenticate ---');
  // Suspend student Bobby via admin toggle status route
  const studentInDb = await User.findOne({ email: 'bobby@university.edu' });
  const suspendRes = await fetch(`${adminUrl}/users/${studentInDb._id}/status`, {
    method: 'PATCH',
    headers: { 'Cookie': adminCookie }
  });

  const suspendData = await suspendRes.json();
  if (suspendRes.status !== 200 || suspendData.data.user.isActive !== false) {
    throw new Error(`Expected suspension to succeed. Status: ${suspendRes.status}`);
  }
  console.log('✓ Student account successfully suspended.');

  // Attempt login
  const suspendedLoginRes = await fetch(`${authUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bobby@university.edu', password: 'NewSecurePassword123!' })
  });

  const suspendedLoginData = await suspendedLoginRes.json();
  if (suspendedLoginRes.status !== 403 || suspendedLoginData.success !== false) {
    throw new Error(`Expected login to be rejected with 403. Status: ${suspendedLoginRes.status}`);
  }
  console.log('✓ Deactivated account login was correctly blocked with 403 Forbidden.');

  console.log('\n======================================');
  console.log('✅ ALL INSTITUTION AUTHENTICATION TESTS PASSED!');
  console.log('======================================\n');
};

runTests();
