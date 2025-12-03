#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let trainerId = '';
let studentId = '';
let matchId = '';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add Content-Length if there's data
    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function logTest(testName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testName}`);
  console.log('='.repeat(60));
}

function logResult(response) {
  console.log(`Status: ${response.status}`);
  console.log('Response:', JSON.stringify(response.data, null, 2));
}

async function test1_Login() {
  logTest('1. Login as GymOwner');
  const response = await makeRequest('POST', '/api/auth/login', {
    email: 'owner@testgym.com',
    password: 'password123'
  });
  logResult(response);

  if (response.status === 200 && response.data?.data?.token) {
    authToken = response.data.data.token;
    console.log('✅ Login successful');
  } else {
    console.error('❌ Login failed');
    process.exit(1);
  }
}

async function test2_GetTrainerAndStudent() {
  logTest('2. Get Trainer and Student IDs');
  const response = await makeRequest('GET', '/api/users?limit=100', null, authToken);

  if (response.status === 200) {
    // User API returns array directly in data
    const users = Array.isArray(response.data?.data) ? response.data.data : [];
    const trainer = users.find(u => u.role.name === 'Trainer');
    const student = users.find(u => u.role.name === 'Student');

    if (trainer && student) {
      trainerId = trainer.id;
      studentId = student.id;
      console.log(`✅ Found trainer: ${trainer.firstName} ${trainer.lastName} (${trainerId})`);
      console.log(`✅ Found student: ${student.firstName} ${student.lastName} (${studentId})`);
    } else {
      console.error('❌ Could not find trainer or student');
      console.error('Users found:', users.map(u => `${u.email} (${u.role.name})`));
      process.exit(1);
    }
  }
}

async function test3_CreateMatch() {
  logTest('3. Create Trainer-Student Match');
  const response = await makeRequest('POST', '/api/trainer-matches', {
    trainerId,
    studentId
  }, authToken);
  logResult(response);

  if (response.status === 201) {
    matchId = response.data.data.id;
    console.log('✅ Match created successfully');
    console.log(`Match ID: ${matchId}`);
  } else {
    console.error('❌ Failed to create match');
  }
}

async function test4_GetAllMatches() {
  logTest('4. Get All Matches');
  const response = await makeRequest('GET', '/api/trainer-matches', null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully retrieved matches');
    const matches = response.data?.data?.matches || [];
    console.log(`Total matches: ${matches.length}`);
  }
}

async function test5_GetMatchById() {
  logTest('5. Get Match by ID');
  const response = await makeRequest('GET', `/api/trainer-matches/${matchId}`, null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully retrieved match details');
  }
}

async function test6_GetTrainerStudents() {
  logTest('6. Get Trainer Students');
  const response = await makeRequest('GET', `/api/trainer-matches/trainer/${trainerId}/students`, null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully retrieved trainer students');
    const students = response.data?.data?.students || [];
    console.log(`Trainer has ${students.length} student(s)`);
  }
}

async function test7_GetStudentTrainer() {
  logTest('7. Get Student Trainer');
  const response = await makeRequest('GET', `/api/trainer-matches/student/${studentId}/trainer`, null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully retrieved student trainer');
  }
}

async function test8_UpdateMatchStatus() {
  logTest('8. Update Match Status to Pending');
  const response = await makeRequest('PATCH', `/api/trainer-matches/${matchId}/status`, {
    status: 'pending'
  }, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully updated match status');
  }
}

async function test9_UpdateMatchStatusBack() {
  logTest('9. Update Match Status Back to Active');
  const response = await makeRequest('PATCH', `/api/trainer-matches/${matchId}/status`, {
    status: 'active'
  }, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully updated match status');
  }
}

async function test10_CreateDuplicateMatch() {
  logTest('10. Try to Create Duplicate Match (should fail)');
  const response = await makeRequest('POST', '/api/trainer-matches', {
    trainerId,
    studentId
  }, authToken);
  logResult(response);

  if (response.status === 409) {
    console.log('✅ Correctly rejected duplicate match');
  } else {
    console.error('❌ Should have rejected duplicate match');
  }
}

async function test11_CreateInvalidMatch() {
  logTest('11. Try to Create Match with Invalid User (should fail)');
  const response = await makeRequest('POST', '/api/trainer-matches', {
    trainerId: studentId,  // Using student as trainer
    studentId: trainerId   // Using trainer as student
  }, authToken);
  logResult(response);

  if (response.status === 400) {
    console.log('✅ Correctly rejected invalid user roles');
  } else {
    console.error('❌ Should have rejected invalid user roles');
  }
}

async function test12_FilterMatchesByStatus() {
  logTest('12. Filter Matches by Status');
  const response = await makeRequest('GET', '/api/trainer-matches?status=active', null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully filtered matches');
  }
}

async function test13_EndMatch() {
  logTest('13. End Trainer-Student Match');
  const response = await makeRequest('DELETE', `/api/trainer-matches/${matchId}`, null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully ended match');
  }
}

async function test14_VerifyMatchEnded() {
  logTest('14. Verify Match Was Ended');
  const response = await makeRequest('GET', `/api/trainer-matches/${matchId}`, null, authToken);
  logResult(response);

  if (response.status === 404) {
    console.log('✅ Match correctly not found after ending');
  } else {
    console.error('❌ Match should not be accessible after ending');
  }
}

async function runTests() {
  console.log('\n🧪 Testing Trainer-Student Matching API');
  console.log('========================================\n');

  try {
    await test1_Login();
    await test2_GetTrainerAndStudent();
    await test3_CreateMatch();
    await test4_GetAllMatches();
    await test5_GetMatchById();
    await test6_GetTrainerStudents();
    await test7_GetStudentTrainer();
    await test8_UpdateMatchStatus();
    await test9_UpdateMatchStatusBack();
    await test10_CreateDuplicateMatch();
    await test11_CreateInvalidMatch();
    await test12_FilterMatchesByStatus();
    await test13_EndMatch();
    await test14_VerifyMatchEnded();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All trainer-student matching tests completed!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    process.exit(1);
  }
}

runTests();
