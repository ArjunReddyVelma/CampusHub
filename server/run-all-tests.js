const { fork } = require('child_process');
const path = require('path');

const suites = [
  { name: 'Authentication', file: 'test-auth.js' },
  { name: 'Quizzes', file: 'test-quizzes.js' },
  { name: 'Quiz Attempts', file: 'test-attempts.js' },
  { name: 'Clubs & Hackathons', file: 'test-clubs.js' },
  { name: 'Teams & Invitations', file: 'test-teams.js' },
  { name: 'Submissions & Dates', file: 'test-submissions.js' },
  { name: 'Announcements & Feed', file: 'test-announcements.js' },
  { name: 'Full-Text Search', file: 'test-search.js' },
  { name: 'Professor E2E', file: 'test-professor-e2e.js' },
  { name: 'Club Admin E2E', file: 'test-club-e2e.js' },
  { name: 'Submissions & Judging E2E', file: 'test-submissions-e2e.js' },
  { name: 'Admin Console E2E', file: 'test-admin-e2e.js' }
];

const runSuite = (suite) => {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = fork(path.join(__dirname, suite.file), [], { stdio: 'pipe' });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });
    
    child.on('close', (code) => {
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      resolve({
        name: suite.name,
        success: code === 0,
        duration,
        stdout,
        stderr
      });
    });
  });
};

const runAll = async () => {
  console.log('=== STARTING ALL QA REGRESSION SUITES ===\n');
  const results = [];
  let dependencyFailed = false;
  
  for (const suite of suites) {
    if (dependencyFailed) {
      console.log(`- ${suite.name} skipped due to dependency failure`);
      results.push({ name: suite.name, success: false, skipped: true, duration: '0.0' });
      continue;
    }
    
    console.log(`Running ${suite.name}...`);
    const res = await runSuite(suite);
    results.push(res);
    
    if (res.success) {
      console.log(`✓ ${res.name} passed in ${res.duration}s`);
    } else {
      console.error(`✗ ${res.name} FAILED in ${res.duration}s`);
      console.error('--- Error Output ---');
      console.error(res.stderr || res.stdout);
      console.error('--------------------');
      
      // If authentication or basic models fail, fail fast and block dependent E2E suites
      if (suite.name === 'Authentication') {
        console.error('\n[FATAL] Basic Authentication tests failed. Skipping remaining suites.');
        dependencyFailed = true;
      }
    }
  }
  
  console.log('\n=== QA SYSTEM VERIFICATION SUMMARY ===\n');
  let passedCount = 0;
  let skippedCount = 0;
  
  for (const res of results) {
    if (res.skipped) {
      console.log(`- ${res.name.padEnd(25)} SKIPPED`);
      skippedCount++;
    } else if (res.success) {
      console.log(`✓ ${res.name.padEnd(25)} ${res.duration}s`);
      passedCount++;
    } else {
      console.log(`✗ ${res.name.padEnd(25)} ${res.duration}s`);
    }
  }
  
  console.log(`\nSummary: ${passedCount}/${suites.length} passed, ${skippedCount} skipped`);
  
  if (passedCount === suites.length) {
    console.log('\n✅ QA PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('\n❌ QA FAILED!');
    process.exit(1);
  }
};

runAll();
