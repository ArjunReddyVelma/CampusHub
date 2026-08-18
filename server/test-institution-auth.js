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
  if (dashboardRes.status !== 403 || dashboardData.code !== 'PASSWORD_CHANGE_REQUIRED') {
    throw new Error(`Expected access to dashboard to be blocked with 403 PASSWORD_CHANGE_REQUIRED. Status: ${dashboardRes.status}, data: ${JSON.stringify(dashboardData)}`);
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

  // --- CSV Import Transaction/Atomicity Tests ---
  console.log('\n--- Test 10: CSV Import Atomicity Verification ---');

  // Case 1: 100 valid rows
  console.log('Case 1: Importing 100 valid rows...');
  const initialCount = await User.countDocuments({});
  let validCsv = 'name,email,role,universityId,department,year\n';
  for (let i = 1; i <= 100; i++) {
    validCsv += `CSV Student ${i},csvstudent${i}@university.edu,student,SPSUCSV${i},CSE,1\n`;
  }

  const validCsvRes = await fetch(`${adminUrl}/users/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({ csv: validCsv })
  });

  const validCsvData = await validCsvRes.json();
  if (validCsvRes.status !== 201 || !validCsvData.success) {
    throw new Error(`Expected 100 rows CSV import to succeed. Status: ${validCsvRes.status}, data: ${JSON.stringify(validCsvData)}`);
  }
  const countAfterValid = await User.countDocuments({});
  if (countAfterValid - initialCount !== 100) {
    throw new Error(`Expected exactly 100 users to be created, but got ${countAfterValid - initialCount}`);
  }
  console.log('✓ 100 valid rows imported successfully (100 users created).');

  // Case 2: 99 valid + 1 invalid row
  console.log('Case 2: Importing 99 valid + 1 invalid role row...');
  const countBeforeCase2 = await User.countDocuments({});
  let invalidRoleCsv = 'name,email,role,universityId,department,year\n';
  for (let i = 101; i <= 199; i++) {
    invalidRoleCsv += `CSV Student ${i},csvstudent${i}@university.edu,student,SPSUCSV${i},CSE,1\n`;
  }
  invalidRoleCsv += `CSV Bad Student,csvbadstudent@university.edu,super-hacker,SPSUCSV200,CSE,1\n`; // Invalid role

  const csvInvalidRoleRes = await fetch(`${adminUrl}/users/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({ csv: invalidRoleCsv })
  });

  const csvInvalidRoleData = await csvInvalidRoleRes.json();
  if (csvInvalidRoleRes.status !== 400 || csvInvalidRoleData.success !== false) {
    throw new Error(`Expected invalid role CSV import to fail with 400. Status: ${csvInvalidRoleRes.status}`);
  }
  const countAfterCase2 = await User.countDocuments({});
  if (countAfterCase2 !== countBeforeCase2) {
    throw new Error(`Atomicity failure! Expected 0 users to be created, but found ${countAfterCase2 - countBeforeCase2} users created.`);
  }
  console.log('✓ Case 2 atomic check passed. 0 partial users created.');

  // Case 3: Duplicate email inside CSV
  console.log('Case 3: Importing CSV with duplicate email in rows...');
  const countBeforeCase3 = await User.countDocuments({});
  let dupEmailCsv = 'name,email,role,universityId,department,year\n';
  dupEmailCsv += `Student A,student_a@university.edu,student,SPSUCSV_A,CSE,1\n`;
  dupEmailCsv += `Student B,student_a@university.edu,student,SPSUCSV_B,CSE,1\n`; // Duplicate email

  const dupEmailRes = await fetch(`${adminUrl}/users/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({ csv: dupEmailCsv })
  });

  const dupEmailData = await dupEmailRes.json();
  if (dupEmailRes.status !== 400) {
    throw new Error(`Expected duplicate email CSV import to fail with 400. Status: ${dupEmailRes.status}`);
  }
  const countAfterCase3 = await User.countDocuments({});
  if (countAfterCase3 !== countBeforeCase3) {
    throw new Error(`Atomicity failure! Expected 0 users to be created, but found ${countAfterCase3 - countBeforeCase3} users created.`);
  }
  console.log('✓ Case 3 atomic check passed. 0 partial users created.');

  // Case 4: Duplicate universityId inside CSV
  console.log('Case 4: Importing CSV with duplicate universityId in rows...');
  const countBeforeCase4 = await User.countDocuments({});
  let dupUIdCsv = 'name,email,role,universityId,department,year\n';
  dupUIdCsv += `Student A,student_a_unique@university.edu,student,SPSUCSV_DUP,CSE,1\n`;
  dupUIdCsv += `Student B,student_b_unique@university.edu,student,SPSUCSV_DUP,CSE,1\n`; // Duplicate universityId

  const dupUIdRes = await fetch(`${adminUrl}/users/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({ csv: dupUIdCsv })
  });

  const dupUIdData = await dupUIdRes.json();
  if (dupUIdRes.status !== 400) {
    throw new Error(`Expected duplicate universityId CSV import to fail with 400. Status: ${dupUIdRes.status}`);
  }
  const countAfterCase4 = await User.countDocuments({});
  if (countAfterCase4 !== countBeforeCase4) {
    throw new Error(`Atomicity failure! Expected 0 users to be created, but found ${countAfterCase4 - countBeforeCase4} users created.`);
  }
  console.log('✓ Case 4 atomic check passed. 0 partial users created.');

  // Case 5: Duplicate employeeId inside CSV
  console.log('Case 5: Importing CSV with duplicate employeeId in rows...');
  const countBeforeCase5 = await User.countDocuments({});
  let dupEmpIdCsv = 'name,email,role,universityId,employeeId,department\n';
  dupEmpIdCsv += `Prof A,prof_a@university.edu,professor,,FAC_DUP,CSE\n`;
  dupEmpIdCsv += `Prof B,prof_b@university.edu,professor,,FAC_DUP,CSE\n`; // Duplicate employeeId

  const dupEmpIdRes = await fetch(`${adminUrl}/users/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({ csv: dupEmpIdCsv })
  });

  const dupEmpIdData = await dupEmpIdRes.json();
  if (dupEmpIdRes.status !== 400) {
    throw new Error(`Expected duplicate employeeId CSV import to fail. Status: ${dupEmpIdRes.status}`);
  }
  const countAfterCase5 = await User.countDocuments({});
  if (countAfterCase5 !== countBeforeCase5) {
    throw new Error(`Atomicity failure! Expected 0 users to be created, but found ${countAfterCase5 - countBeforeCase5} users created.`);
  }
  console.log('✓ Case 5 atomic check passed. 0 partial users created.');

  // Case 6: Profile creation failure during transaction
  console.log('Case 6: Simulating profile validation error during creation...');
  const countBeforeCase6 = await User.countDocuments({});
  const initialProfilesCount = await StudentProfile.countDocuments({});
  
  // Make a student row with invalid academic year format or missing required field that passes initial pre-validation but fails Mongoose validate
  let badProfileCsv = 'name,email,role,universityId,department,year\n';
  badProfileCsv += `Student Valid,student_valid@university.edu,student,SPSUCSV_VALID,CSE,1\n`;
  badProfileCsv += `Student Invalid,student_invalid@university.edu,student,SPSUCSV_INVALID,,1\n`; // Missing department (fails Profile schema)

  const badProfileRes = await fetch(`${adminUrl}/users/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({ csv: badProfileCsv })
  });

  const badProfileData = await badProfileRes.json();
  if (badProfileRes.status !== 400) {
    throw new Error(`Expected Mongoose validate validation to reject CSV import with 400. Status: ${badProfileRes.status}`);
  }

  const countAfterCase6 = await User.countDocuments({});
  const profilesAfterCase6 = await StudentProfile.countDocuments({});
  if (countAfterCase6 !== countBeforeCase6 || profilesAfterCase6 !== initialProfilesCount) {
    throw new Error(`Atomicity failure! Expected 0 users and profiles to be created, but found User change: ${countAfterCase6 - countBeforeCase6}, Profile change: ${profilesAfterCase6 - initialProfilesCount}`);
  }
  console.log('✓ Case 6 atomic check passed. 0 partial users and 0 profiles created.');

  // --- CORS Verification Tests ---
  console.log('\n--- Test 11: CORS Origin Security Audit ---');
  
  // Test 11.1 Allowed Origin
  const corsAllowedRes = await fetch(`${authUrl}/me`, {
    method: 'OPTIONS',
    headers: {
      'Access-Control-Request-Method': 'GET',
      'Origin': 'http://localhost:5173'
    }
  });
  if (corsAllowedRes.headers.get('access-control-allow-origin') !== 'http://localhost:5173') {
    throw new Error(`Expected Access-Control-Allow-Origin to be returned for allowed origin http://localhost:5173. Got: ${corsAllowedRes.headers.get('access-control-allow-origin')}`);
  }
  console.log('✓ CORS correctly allowed origin: http://localhost:5173');

  // Test 11.2 Unauthorized Origin
  const corsUnallowedRes = await fetch(`${authUrl}/me`, {
    method: 'OPTIONS',
    headers: {
      'Access-Control-Request-Method': 'GET',
      'Origin': 'http://unauthorized-origin.com'
    }
  });
  if (corsUnallowedRes.headers.get('access-control-allow-origin') === 'http://unauthorized-origin.com') {
    throw new Error('Security Error: CORS allowed an unauthorized origin!');
  }
  console.log('✓ CORS correctly blocked unauthorized origin: http://unauthorized-origin.com');

  // --- Test 12: Authentication via University ID and Employee ID ---
  console.log('\n--- Test 12: Authentication via University/Employee ID ---');
  
  // Create student with specific universityId
  const studentUserObj = await User.create({
    name: 'ID Student',
    email: 'idstudent@university.edu',
    password: 'password123',
    role: 'student',
    mustChangePassword: false,
    universityId: 'SPSU_E2E_001'
  });
  await StudentProfile.create({
    user: studentUserObj._id,
    universityId: 'SPSU_E2E_001',
    department: 'Computer Science',
    year: 1
  });

  // Attempt login using universityId as the identifier
  const idLoginRes = await fetch(`${authUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'SPSU_E2E_001', password: 'password123' })
  });
  const idLoginData = await idLoginRes.json();
  if (idLoginRes.status !== 200 || !idLoginData.success) {
    throw new Error(`Expected login with universityId to succeed. Status: ${idLoginRes.status}, data: ${JSON.stringify(idLoginData)}`);
  }
  console.log('✓ Login via universityId SPSU_E2E_001 succeeded.');

  // --- Test 13: Forgot Password Reset Flow ---
  console.log('\n--- Test 13: Forgot Password Reset Flow ---');

  // Request reset link
  const forgotRes = await fetch(`${authUrl}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'idstudent@university.edu' })
  });
  const forgotData = await forgotRes.json();
  if (forgotRes.status !== 200 || !forgotData.success) {
    throw new Error(`Expected forgot-password to succeed. Status: ${forgotRes.status}, data: ${JSON.stringify(forgotData)}`);
  }

  // Get token from DB directly
  const dbUser = await User.findOne({ email: 'idstudent@university.edu' });
  const hashedToken = dbUser.resetPasswordToken;
  if (!hashedToken) {
    throw new Error('Expected resetPasswordToken to be saved in database.');
  }

  // Since we hash the token using sha256 of the random bytes token:
  // But wait! For test purposes, we can mock the reset token value by overwriting it with a known value in db
  const testPlaintextToken = 'testresettoken123';
  const crypto = require('crypto');
  dbUser.resetPasswordToken = crypto.createHash('sha256').update(testPlaintextToken).digest('hex');
  dbUser.resetPasswordExpire = Date.now() + 50000;
  await dbUser.save();

  // Call reset password with plaintext token
  const resetRes = await fetch(`${authUrl}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: testPlaintextToken, password: 'newpassword123' })
  });
  const resetData = await resetRes.json();
  if (resetRes.status !== 200 || !resetData.success) {
    throw new Error(`Expected resetPassword to succeed. Status: ${resetRes.status}, data: ${JSON.stringify(resetData)}`);
  }

  // Verify that login works with new password
  const newLoginRes = await fetch(`${authUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'idstudent@university.edu', password: 'newpassword123' })
  });
  if (newLoginRes.status !== 200) {
    throw new Error(`Expected login with new reset password to succeed. Status: ${newLoginRes.status}`);
  }
  console.log('✓ Forgot Password reset workflow E2E verified.');

  // --- Test 14: Administrative Password Reset ---
  console.log('\n--- Test 14: Administrative Password Reset Action ---');

  // Trigger admin reset for student
  const adminResetRes = await fetch(`${adminUrl}/users/${studentUserObj._id}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    }
  });
  const adminResetData = await adminResetRes.json();
  if (adminResetRes.status !== 200 || !adminResetData.success || !adminResetData.data.tempPassword) {
    throw new Error(`Expected admin reset password to succeed. Status: ${adminResetRes.status}, data: ${JSON.stringify(adminResetData)}`);
  }

  // Verify DB state
  const resetUserDb = await User.findById(studentUserObj._id);
  if (!resetUserDb.mustChangePassword || resetUserDb.passwordState !== 'Password Reset Required') {
    throw new Error(`Expected mustChangePassword=true and passwordState=Password Reset Required. Got: ${resetUserDb.mustChangePassword}, ${resetUserDb.passwordState}`);
  }

  // Login with temporary credentials
  const tempLoginRes = await fetch(`${authUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'idstudent@university.edu', password: adminResetData.data.tempPassword })
  });
  const tempLoginCookies = tempLoginRes.headers.get('set-cookie');
  let tempLoginCookie = '';
  if (tempLoginCookies) {
    const match = tempLoginCookies.match(/token=([^;]+)/);
    if (match) tempLoginCookie = match[0];
  }

  // Try accessing admin dashboard using cookie - should return 403 PASSWORD_CHANGE_REQUIRED
  const blockedDashRes = await fetch(`${adminUrl}/dashboard`, {
    method: 'GET',
    headers: { 'Cookie': tempLoginCookie }
  });
  const blockedDashData = await blockedDashRes.json();
  if (blockedDashRes.status !== 403 || blockedDashData.code !== 'PASSWORD_CHANGE_REQUIRED') {
    throw new Error(`Expected access to dashboard to be blocked with 403 PASSWORD_CHANGE_REQUIRED. Status: ${blockedDashRes.status}, data: ${JSON.stringify(blockedDashData)}`);
  }

  console.log('✓ Administrative reset, passwordState transition, and forced redirect E2E verified.');

  console.log('\n======================================');
  console.log('✅ ALL INSTITUTION AUTHENTICATION TESTS PASSED!');
  console.log('======================================\n');
};

runTests();
