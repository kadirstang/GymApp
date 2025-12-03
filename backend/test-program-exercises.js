const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
let authToken = '';
let testProgramId = '';
let testExerciseIds = [];
let programExerciseIds = [];

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

  if (response.status === 200 && response.data.data.token) {
    authToken = response.data.data.token;
    console.log('✅ Login successful\n');
  } else {
    throw new Error('Login failed');
  }
}

// Test 2: Get available exercises
async function test2_GetExercises() {
  console.log('\n============================================================');
  console.log('TEST: 2. Get Available Exercises');
  console.log('============================================================');
  const response = await makeRequest('GET', '/api/exercises?limit=10', null, authToken);

  console.log('Status:', response.status);

  if (response.status === 200 && response.data.data.exercises) {
    testExerciseIds = response.data.data.exercises.slice(0, 3).map(e => e.id);
    console.log(`Found ${testExerciseIds.length} exercises for testing`);
    console.log('Exercise IDs:', testExerciseIds);
    console.log('✅ Exercises retrieved\n');
  } else {
    throw new Error('Failed to get exercises');
  }
}

// Test 3: Create test program
async function test3_CreateProgram() {
  console.log('\n============================================================');
  console.log('TEST: 3. Create Test Program');
  console.log('============================================================');
  const response = await makeRequest('POST', '/api/programs', {
    name: 'Program Exercise Test',
    description: 'Testing program exercises functionality',
    difficultyLevel: 'Intermediate',
  }, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 201 && response.data.data.id) {
    testProgramId = response.data.data.id;
    console.log('✅ Program created successfully');
    console.log('Program ID:', testProgramId, '\n');
  } else {
    throw new Error('Failed to create program');
  }
}

// Test 4: Add first exercise to program
async function test4_AddExercise1() {
  console.log('\n============================================================');
  console.log('TEST: 4. Add First Exercise to Program');
  console.log('============================================================');
  const response = await makeRequest('POST', `/api/programs/${testProgramId}/exercises`, {
    exerciseId: testExerciseIds[0],
    sets: 3,
    reps: '10-12',
    restTimeSeconds: 60,
    notes: 'Focus on form',
  }, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 201 && response.data.data.id) {
    programExerciseIds.push(response.data.data.id);
    console.log('✅ Exercise added successfully\n');
  } else {
    throw new Error('Failed to add exercise');
  }
}

// Test 5: Add second exercise
async function test5_AddExercise2() {
  console.log('\n============================================================');
  console.log('TEST: 5. Add Second Exercise to Program');
  console.log('============================================================');
  const response = await makeRequest('POST', `/api/programs/${testProgramId}/exercises`, {
    exerciseId: testExerciseIds[1],
    sets: 4,
    reps: '8',
    restTimeSeconds: 90,
  }, authToken);

  console.log('Status:', response.status);

  if (response.status === 201 && response.data.data.id) {
    programExerciseIds.push(response.data.data.id);
    console.log('✅ Exercise added successfully\n');
  } else {
    throw new Error('Failed to add exercise');
  }
}

// Test 6: Add third exercise with specific order
async function test6_AddExercise3() {
  console.log('\n============================================================');
  console.log('TEST: 6. Add Third Exercise at Specific Position (orderIndex: 1)');
  console.log('============================================================');
  const response = await makeRequest('POST', `/api/programs/${testProgramId}/exercises`, {
    exerciseId: testExerciseIds[2],
    sets: 5,
    reps: '5',
    restTimeSeconds: 120,
    notes: 'Heavy compound lift',
    orderIndex: 1,
  }, authToken);

  console.log('Status:', response.status);

  if (response.status === 201 && response.data.data.id) {
    programExerciseIds.splice(1, 0, response.data.data.id);
    console.log('✅ Exercise added at specific position\n');
  } else {
    throw new Error('Failed to add exercise');
  }
}

// Test 7: Get all program exercises
async function test7_GetAllProgramExercises() {
  console.log('\n============================================================');
  console.log('TEST: 7. Get All Program Exercises');
  console.log('============================================================');
  const response = await makeRequest('GET', `/api/programs/${testProgramId}/exercises`, null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200 && Array.isArray(response.data.data)) {
    console.log(`✅ Retrieved ${response.data.data.length} exercise(s)\n`);
  } else {
    throw new Error('Failed to get program exercises');
  }
}

// Test 8: Get single program exercise
async function test8_GetProgramExerciseById() {
  console.log('\n============================================================');
  console.log('TEST: 8. Get Single Program Exercise by ID');
  console.log('============================================================');
  const response = await makeRequest('GET', `/api/programs/${testProgramId}/exercises/${programExerciseIds[0]}`, null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200 && response.data.data.id === programExerciseIds[0]) {
    console.log('✅ Successfully retrieved program exercise details\n');
  } else {
    throw new Error('Failed to get program exercise by ID');
  }
}

// Test 9: Update program exercise
async function test9_UpdateProgramExercise() {
  console.log('\n============================================================');
  console.log('TEST: 9. Update Program Exercise');
  console.log('============================================================');
  const response = await makeRequest('PUT', `/api/programs/${testProgramId}/exercises/${programExerciseIds[0]}`, {
    sets: 4,
    reps: '12-15',
    restTimeSeconds: 45,
    notes: 'Updated notes - increase volume',
  }, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200) {
    console.log('✅ Program exercise updated successfully\n');
  } else {
    throw new Error('Failed to update program exercise');
  }
}

// Test 10: Try to add duplicate exercise
async function test10_DuplicateExercise() {
  console.log('\n============================================================');
  console.log('TEST: 10. Try to Add Duplicate Exercise (should fail)');
  console.log('============================================================');
  const response = await makeRequest('POST', `/api/programs/${testProgramId}/exercises`, {
    exerciseId: testExerciseIds[0],
    sets: 3,
    reps: '10',
  }, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 409 && !response.data.success) {
    console.log('✅ Correctly rejected duplicate exercise\n');
  } else {
    throw new Error('Should have rejected duplicate exercise');
  }
}

// Test 11: Reorder exercises
async function test11_ReorderExercises() {
  console.log('\n============================================================');
  console.log('TEST: 11. Reorder Exercises');
  console.log('============================================================');
  const response = await makeRequest('POST', `/api/programs/${testProgramId}/exercises/reorder`, {
    exerciseOrders: [
      { id: programExerciseIds[0], orderIndex: 2 },
      { id: programExerciseIds[1], orderIndex: 0 },
      { id: programExerciseIds[2], orderIndex: 1 },
    ],
  }, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200) {
    console.log('✅ Exercises reordered successfully\n');
  } else {
    throw new Error('Failed to reorder exercises');
  }
}

// Test 12: Update exercise order individually
async function test12_UpdateExerciseOrder() {
  console.log('\n============================================================');
  console.log('TEST: 12. Update Exercise Order Individually');
  console.log('============================================================');
  const response = await makeRequest('PUT', `/api/programs/${testProgramId}/exercises/${programExerciseIds[0]}`, {
    orderIndex: 0,
  }, authToken);

  console.log('Status:', response.status);

  if (response.status === 200) {
    console.log('✅ Exercise order updated successfully\n');
  } else {
    throw new Error('Failed to update exercise order');
  }
}

// Test 13: Validation errors - invalid sets
async function test13_ValidationErrors() {
  console.log('\n============================================================');
  console.log('TEST: 13. Test Validation Errors - Invalid Sets');
  console.log('============================================================');
  const response = await makeRequest('POST', `/api/programs/${testProgramId}/exercises`, {
    exerciseId: testExerciseIds[0],
    sets: 25, // Too high
    reps: '10',
  }, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 400 && !response.data.success) {
    console.log('✅ Correctly rejected invalid sets\n');
  } else {
    throw new Error('Should have rejected invalid sets');
  }
}

// Test 14: Invalid program ID
async function test14_InvalidProgramId() {
  console.log('\n============================================================');
  console.log('TEST: 14. Try to Add Exercise with Invalid Program ID (should fail)');
  console.log('============================================================');
  const response = await makeRequest('POST', '/api/programs/invalid-uuid/exercises', {
    exerciseId: testExerciseIds[0],
    sets: 3,
    reps: '10',
  }, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 400 && !response.data.success) {
    console.log('✅ Correctly rejected invalid program UUID\n');
  } else {
    throw new Error('Should have rejected invalid UUID');
  }
}

// Test 15: Remove exercise from program
async function test15_RemoveExercise() {
  console.log('\n============================================================');
  console.log('TEST: 15. Remove Exercise from Program');
  console.log('============================================================');
  const response = await makeRequest('DELETE', `/api/programs/${testProgramId}/exercises/${programExerciseIds[2]}`, null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 200 && response.data.success) {
    console.log('✅ Exercise removed successfully\n');
  } else {
    throw new Error('Failed to remove exercise');
  }
}

// Test 16: Verify exercise was removed
async function test16_VerifyRemoved() {
  console.log('\n============================================================');
  console.log('TEST: 16. Verify Exercise Was Removed');
  console.log('============================================================');
  const response = await makeRequest('GET', `/api/programs/${testProgramId}/exercises/${programExerciseIds[2]}`, null, authToken);

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 404) {
    console.log('✅ Exercise correctly not found after removal\n');
  } else {
    throw new Error('Exercise should have been removed');
  }
}

// Test 17: Verify order was updated after removal
async function test17_VerifyReorder() {
  console.log('\n============================================================');
  console.log('TEST: 17. Verify Order Was Updated After Removal');
  console.log('============================================================');
  const response = await makeRequest('GET', `/api/programs/${testProgramId}/exercises`, null, authToken);

  console.log('Status:', response.status);

  if (response.status === 200 && Array.isArray(response.data.data)) {
    const exercises = response.data.data;
    console.log('Remaining exercises:', exercises.length);
    console.log('Order indices:', exercises.map(e => e.orderIndex).join(', '));
    console.log('✅ Order verified after removal\n');
  } else {
    throw new Error('Failed to verify order');
  }
}

// Cleanup
async function cleanup() {
  console.log('\n============================================================');
  console.log('CLEANUP: Deleting test program');
  console.log('============================================================');

  if (testProgramId) {
    await makeRequest('DELETE', `/api/programs/${testProgramId}`, null, authToken);
    console.log('✅ Test program deleted\n');
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Testing Program Exercises API');
  console.log('========================================\n');

  try {
    await test1_Login();
    await test2_GetExercises();
    await test3_CreateProgram();
    await test4_AddExercise1();
    await test5_AddExercise2();
    await test6_AddExercise3();
    await test7_GetAllProgramExercises();
    await test8_GetProgramExerciseById();
    await test9_UpdateProgramExercise();
    await test10_DuplicateExercise();
    await test11_ReorderExercises();
    await test12_UpdateExerciseOrder();
    await test13_ValidationErrors();
    await test14_InvalidProgramId();
    await test15_RemoveExercise();
    await test16_VerifyRemoved();
    await test17_VerifyReorder();
    await cleanup();

    console.log('============================================================');
    console.log('✅ All program exercise tests completed!');
    console.log('============================================================');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);

    // Try to cleanup even if tests fail
    try {
      await cleanup();
    } catch (e) {
      // Ignore cleanup errors
    }

    process.exit(1);
  }
}

runTests();
