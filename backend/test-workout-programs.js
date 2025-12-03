const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
let authToken = '';
let testGymId = '';
let testUserId = '';
let testStudentId = '';
let createdProgramId = '';
let clonedProgramId = '';

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test cleanup function
async function cleanup() {
  console.log('\n============================================================');
  console.log('TEST: 0. Cleanup - Delete test programs from previous runs');
  console.log('============================================================');

  try {
    // Get all programs
    const response = await makeRequest('GET', '/api/programs?limit=100', null, authToken);

    if (response.data.success && response.data.data.programs) {
      const testProgramNames = [
        'Full Body Strength',
        'Upper Body Hypertrophy',
        'Leg Day Program',
        'Full Body Strength (Updated)',
        'Full Body Strength (Copy)',
      ];

      for (const program of response.data.data.programs) {
        if (testProgramNames.includes(program.name)) {
          await makeRequest('DELETE', `/api/programs/${program.id}`, null, authToken);
          console.log(`Deleted: ${program.name} (${program.id})`);
        }
      }
    }

    console.log('✅ Cleanup completed\n');
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
}

// Test 1: Login
async function test1_Login() {
  console.log('\n============================================================');
  console.log('TEST: 1. Login as GymOwner');
  console.log('============================================================');
  const response = await makeRequest('POST', '/api/auth/login', {
    email: 'owner@testgym.com',
    password: 'password123',
  });

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200 && response.data.data.token) {
    authToken = response.data.data.token;
    testGymId = response.data.data.user.gymId;
    testUserId = response.data.data.user.id;
    console.log('✅ Login successful\n');
  } else {
    throw new Error('Login failed');
  }
}

// Test 2: Get student user for assignment
async function test2_GetStudent() {
  console.log('\n============================================================');
  console.log('TEST: 2. Get Student User (for program assignment)');
  console.log('============================================================');
  const response = await makeRequest('GET', '/api/users?limit=100', null, authToken);

  console.log('Status:', response.status);

  if (response.status === 200 && response.data.data) {
    const users = Array.isArray(response.data.data) ? response.data.data : response.data.data.users;
    if (users) {
      const student = users.find(u => u.role.name === 'Student');
      if (student) {
        testStudentId = student.id;
        console.log(`Found student: ${student.firstName} ${student.lastName} (${student.id})`);
        console.log('✅ Student found\n');
      } else {
        console.log('⚠️  No student found, will test without assignment\n');
      }
    } else {
      console.log('⚠️  No users in response, will test without assignment\n');
    }
  } else {
    throw new Error('Failed to get users');
  }
}

// Test 3: Create workout program - Full Body Strength
async function test3_CreateProgram1() {
  console.log('\n============================================================');
  console.log('TEST: 3. Create Program - Full Body Strength (Beginner)');
  console.log('============================================================');
  const response = await makeRequest('POST', '/api/programs', {
    name: 'Full Body Strength',
    description: 'A comprehensive full body strength program for beginners',
    difficultyLevel: 'Beginner',
    assignedUserId: testStudentId || null,
  }, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 201 && response.data.data.id) {
    createdProgramId = response.data.data.id;
    console.log('✅ Program created successfully');
    console.log('Program ID:', createdProgramId, '\n');
  } else {
    throw new Error('Failed to create program');
  }
}

// Test 4: Create program - Upper Body Hypertrophy
async function test4_CreateProgram2() {
  console.log('\n============================================================');
  console.log('TEST: 4. Create Program - Upper Body Hypertrophy (Intermediate)');
  console.log('============================================================');
  const response = await makeRequest('POST', '/api/programs', {
    name: 'Upper Body Hypertrophy',
    description: 'Focus on upper body muscle growth',
    difficultyLevel: 'Intermediate',
  }, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 201) {
    console.log('✅ Program created successfully\n');
  } else {
    throw new Error('Failed to create program');
  }
}

// Test 5: Create program - Leg Day
async function test5_CreateProgram3() {
  console.log('\n============================================================');
  console.log('TEST: 5. Create Program - Leg Day Program (Advanced)');
  console.log('============================================================');
  const response = await makeRequest('POST', '/api/programs', {
    name: 'Leg Day Program',
    description: 'Advanced leg training program',
    difficultyLevel: 'Advanced',
  }, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 201) {
    console.log('✅ Program created successfully\n');
  } else {
    throw new Error('Failed to create program');
  }
}

// Test 6: Get all programs
async function test6_GetAllPrograms() {
  console.log('\n============================================================');
  console.log('TEST: 6. Get All Programs');
  console.log('============================================================');
  const response = await makeRequest('GET', '/api/programs', null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200 && response.data.data.programs) {
    console.log(`✅ Successfully retrieved ${response.data.data.programs.length} program(s)\n`);
  } else {
    throw new Error('Failed to get programs');
  }
}

// Test 7: Get program by ID
async function test7_GetProgramById() {
  console.log('\n============================================================');
  console.log('TEST: 7. Get Program by ID');
  console.log('============================================================');
  const response = await makeRequest('GET', `/api/programs/${createdProgramId}`, null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200 && response.data.data.id === createdProgramId) {
    console.log('✅ Successfully retrieved program details\n');
  } else {
    throw new Error('Failed to get program by ID');
  }
}

// Test 8: Search programs
async function test8_SearchPrograms() {
  console.log('\n============================================================');
  console.log('TEST: 8. Search Programs - "strength"');
  console.log('============================================================');
  const response = await makeRequest('GET', '/api/programs?search=strength', null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200 && response.data.data.programs) {
    console.log(`✅ Found ${response.data.data.programs.length} program(s) matching "strength"\n`);
  } else {
    throw new Error('Failed to search programs');
  }
}

// Test 9: Filter by difficulty
async function test9_FilterByDifficulty() {
  console.log('\n============================================================');
  console.log('TEST: 9. Filter Programs by Difficulty - "Beginner"');
  console.log('============================================================');
  const response = await makeRequest('GET', '/api/programs?difficultyLevel=Beginner', null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200 && response.data.data.programs) {
    console.log(`✅ Found ${response.data.data.programs.length} beginner program(s)\n`);
  } else {
    throw new Error('Failed to filter programs');
  }
}

// Test 10: Filter by assigned user
async function test10_FilterByAssignedUser() {
  console.log('\n============================================================');
  console.log('TEST: 10. Filter Programs by Assigned User');
  console.log('============================================================');

  if (!testStudentId) {
    console.log('⚠️  Skipping - no student ID available\n');
    return;
  }

  const response = await makeRequest('GET', `/api/programs?assignedUserId=${testStudentId}`, null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200) {
    console.log(`✅ Retrieved programs for student\n`);
  } else {
    throw new Error('Failed to filter programs by assigned user');
  }
}

// Test 11: Get program statistics
async function test11_GetProgramStats() {
  console.log('\n============================================================');
  console.log('TEST: 11. Get Program Statistics');
  console.log('============================================================');
  const response = await makeRequest('GET', '/api/programs/stats', null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200) {
    console.log('✅ Successfully retrieved program statistics\n');
  } else {
    throw new Error('Failed to get program statistics');
  }
}

// Test 12: Update program
async function test12_UpdateProgram() {
  console.log('\n============================================================');
  console.log('TEST: 12. Update Program');
  console.log('============================================================');
  const response = await makeRequest('PUT', `/api/programs/${createdProgramId}`, {
    name: 'Full Body Strength (Updated)',
    description: 'Updated description with more details',
    difficultyLevel: 'Intermediate',
  }, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200) {
    console.log('✅ Program updated successfully\n');
  } else {
    throw new Error('Failed to update program');
  }
}

// Test 13: Clone program
async function test13_CloneProgram() {
  console.log('\n============================================================');
  console.log('TEST: 13. Clone Program');
  console.log('============================================================');
  const response = await makeRequest('POST', `/api/programs/${createdProgramId}/clone`, {
    name: 'Full Body Strength (Copy)',
  }, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 201 && response.data.data.id) {
    clonedProgramId = response.data.data.id;
    console.log('✅ Program cloned successfully');
    console.log('Cloned Program ID:', clonedProgramId, '\n');
  } else {
    throw new Error('Failed to clone program');
  }
}

// Test 14: Invalid program ID
async function test14_InvalidProgramId() {
  console.log('\n============================================================');
  console.log('TEST: 14. Get Program with Invalid ID (should fail)');
  console.log('============================================================');
  const response = await makeRequest('GET', '/api/programs/invalid-uuid', null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 400 && !response.data.success) {
    console.log('✅ Correctly rejected invalid UUID\n');
  } else {
    throw new Error('Should have rejected invalid UUID');
  }
}

// Test 15: Pagination
async function test15_Pagination() {
  console.log('\n============================================================');
  console.log('TEST: 15. Test Pagination - Page 1, Limit 2');
  console.log('============================================================');
  const response = await makeRequest('GET', '/api/programs?page=1&limit=2', null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200 && response.data.data.programs.length <= 2) {
    console.log(`✅ Retrieved ${response.data.data.programs.length} program(s)`);
    console.log(`Pagination: ${response.data.data.pagination.page}/${response.data.data.pagination.totalPages} pages\n`);
  } else {
    throw new Error('Pagination test failed');
  }
}

// Test 16: Delete program
async function test16_DeleteProgram() {
  console.log('\n============================================================');
  console.log('TEST: 16. Delete Program');
  console.log('============================================================');
  const response = await makeRequest('DELETE', `/api/programs/${clonedProgramId}`, null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200 && response.data.success) {
    console.log('✅ Program deleted successfully\n');
  } else {
    throw new Error('Failed to delete program');
  }
}

// Test 17: Verify program was deleted
async function test17_VerifyDeleted() {
  console.log('\n============================================================');
  console.log('TEST: 17. Verify Program Was Deleted');
  console.log('============================================================');
  const response = await makeRequest('GET', `/api/programs/${clonedProgramId}`, null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 404) {
    console.log('✅ Program correctly not found after deletion\n');
  } else {
    throw new Error('Program should have been deleted');
  }
}

// Test 18: Validation errors
async function test18_ValidationErrors() {
  console.log('\n============================================================');
  console.log('TEST: 18. Test Validation Errors - Empty Name');
  console.log('============================================================');
  const response = await makeRequest('POST', '/api/programs', {
    name: '',
    description: 'Test program',
  }, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 400 && !response.data.success) {
    console.log('✅ Correctly rejected empty name\n');
  } else {
    throw new Error('Should have rejected empty name');
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Testing Workout Programs API');
  console.log('========================================\n');

  try {
    await test1_Login();
    await cleanup();
    await test2_GetStudent();
    await test3_CreateProgram1();
    await test4_CreateProgram2();
    await test5_CreateProgram3();
    await test6_GetAllPrograms();
    await test7_GetProgramById();
    await test8_SearchPrograms();
    await test9_FilterByDifficulty();
    await test10_FilterByAssignedUser();
    await test11_GetProgramStats();
    await test12_UpdateProgram();
    await test13_CloneProgram();
    await test14_InvalidProgramId();
    await test15_Pagination();
    await test16_DeleteProgram();
    await test17_VerifyDeleted();
    await test18_ValidationErrors();

    console.log('============================================================');
    console.log('✅ All workout program tests completed!');
    console.log('============================================================');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runTests();
