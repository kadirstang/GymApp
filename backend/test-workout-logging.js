#!/usr/bin/env node

/**
 * Workout Logging API Test Script
 * Tests all endpoints for workout logging functionality
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let studentToken = '';
let testProgramId = '';
let testWorkoutLogId = '';
let testSetEntryId = '';
let studentUserId = '';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = '') {
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
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
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

// Test functions
async function testLogin() {
  console.log('\n1. Testing login...');
  const response = await makeRequest('POST', '/api/auth/login', {
    email: 'trainer@testgym.com',
    password: 'password123',
  });

  if (response.status === 200 && response.data.data.token) {
    authToken = response.data.data.token;
    console.log('✓ Login successful');
    return true;
  } else {
    console.log('✗ Login failed:', response.data);
    return false;
  }
}

async function testGetStudentUser() {
  console.log('\n2. Getting student user...');
  const response = await makeRequest('GET', '/api/users?role=Student', null, authToken);

  if (response.status === 200 && response.data.data) {
    // Handle both response structures: direct array or nested users property
    const users = Array.isArray(response.data.data) ? response.data.data : response.data.data.users;
    if (users && users.length > 0) {
      const student = users.find(u => u.email === 'student@testgym.com');
      if (student) {
        studentUserId = student.id;
        console.log(`✓ Student user found: ${student.firstName} ${student.lastName} (${student.id})`);
        return true;
      }
    }
  }
  console.log('✗ Failed to get student user');
  return false;
}

async function testLoginAsStudent() {
  console.log('\n3. Logging in as student...');
  const response = await makeRequest('POST', '/api/auth/login', {
    email: 'student@testgym.com',
    password: 'password123',
  });

  if (response.status === 200 && response.data.data.token) {
    studentToken = response.data.data.token;
    console.log('✓ Student login successful');
    return true;
  } else {
    console.log('✗ Student login failed:', response.data);
    return false;
  }
}

async function testGetExercises() {
  console.log('\n4. Getting exercises...');
  const response = await makeRequest('GET', '/api/exercises?limit=5', null, authToken);

  if (response.status === 200 && response.data.data.exercises.length > 0) {
    console.log(`✓ Found ${response.data.data.exercises.length} exercises`);
    return response.data.data.exercises;
  } else {
    console.log('✗ Failed to get exercises');
    return [];
  }
}

async function testCreateProgram(exercises) {
  console.log('\n5. Creating test program...');

  // First, create a program
  const programResponse = await makeRequest('POST', '/api/programs', {
    name: 'Test Workout Log Program',
    description: 'Program for testing workout logging',
    difficultyLevel: 'Intermediate',
    assignedUserId: studentUserId,
  }, authToken);

  if (programResponse.status !== 201) {
    console.log('✗ Failed to create program');
    return null;
  }

  testProgramId = programResponse.data.data.id;
  console.log(`✓ Program created: ${testProgramId}`);

  // Add exercises to the program
  console.log('  Adding exercises to program...');
  for (let i = 0; i < Math.min(3, exercises.length); i++) {
    const exercise = exercises[i];
    const addResponse = await makeRequest('POST', `/api/programs/${testProgramId}/exercises`, {
      exerciseId: exercise.id,
      sets: 3,
      reps: '10-12',
      restTimeSeconds: 60,
      notes: `Exercise ${i + 1} notes`,
    }, authToken);

    if (addResponse.status === 201) {
      console.log(`  ✓ Added exercise: ${exercise.name}`);
    }
  }

  return testProgramId;
}

async function testStartWorkout() {
  console.log('\n6. Starting workout session...');
  const response = await makeRequest('POST', '/api/workout-logs/start', {
    programId: testProgramId,
    notes: 'Test workout session',
  }, studentToken);

  if (response.status === 201) {
    testWorkoutLogId = response.data.data.id;
    console.log(`✓ Workout started: ${testWorkoutLogId}`);
    console.log(`  Started at: ${response.data.data.startedAt}`);
    console.log(`  Program: ${response.data.data.program.name}`);
    return true;
  } else {
    console.log('✗ Failed to start workout:', response.data);
    return false;
  }
}

async function testStartWorkoutWithActiveWorkout() {
  console.log('\n7. Testing prevention of multiple active workouts...');
  const response = await makeRequest('POST', '/api/workout-logs/start', {
    programId: testProgramId,
  }, studentToken);

  if (response.status === 409) {
    console.log('✓ Correctly prevented starting another workout when one is active');
    return true;
  } else {
    console.log('✗ Should have prevented starting another workout');
    return false;
  }
}

async function testGetActiveWorkout() {
  console.log('\n8. Getting active workout...');
  const response = await makeRequest('GET', '/api/workout-logs/active', null, studentToken);

  if (response.status === 200 && response.data.data) {
    console.log(`✓ Active workout retrieved: ${response.data.data.id}`);
    console.log(`  Program: ${response.data.data.program.name}`);
    console.log(`  Sets logged so far: ${response.data.data.entries.length}`);
    return true;
  } else {
    console.log('✗ Failed to get active workout');
    return false;
  }
}

async function testLogSet(exerciseId, setNumber, weight, reps, rpe) {
  console.log(`\n9.${setNumber}. Logging set ${setNumber}...`);
  const response = await makeRequest('POST', `/api/workout-logs/${testWorkoutLogId}/sets`, {
    exerciseId,
    setNumber,
    weightKg: weight,
    repsCompleted: reps,
    rpe,
  }, studentToken);

  if (response.status === 201) {
    if (setNumber === 1) {
      testSetEntryId = response.data.data.id;
    }
    console.log(`✓ Set ${setNumber} logged: ${weight}kg × ${reps} reps, RPE ${rpe}`);
    console.log(`  Exercise: ${response.data.data.exercise.name}`);
    return true;
  } else {
    console.log(`✗ Failed to log set ${setNumber}:`, response.data);
    return false;
  }
}

async function testUpdateSetEntry() {
  console.log('\n10. Updating set entry...');
  const response = await makeRequest('PUT', `/api/workout-logs/${testWorkoutLogId}/sets/${testSetEntryId}`, {
    weightKg: 62.5,
    repsCompleted: 11,
    rpe: 8,
  }, studentToken);

  if (response.status === 200) {
    console.log('✓ Set entry updated successfully');
    console.log(`  New values: ${response.data.data.weightKg}kg × ${response.data.data.repsCompleted} reps, RPE ${response.data.data.rpe}`);
    return true;
  } else {
    console.log('✗ Failed to update set entry:', response.data);
    return false;
  }
}

async function testGetWorkoutById() {
  console.log('\n11. Getting workout by ID...');
  const response = await makeRequest('GET', `/api/workout-logs/${testWorkoutLogId}`, null, studentToken);

  if (response.status === 200) {
    console.log('✓ Workout retrieved successfully');
    console.log(`  Program: ${response.data.data.program.name}`);
    console.log(`  Total sets: ${response.data.data.entries.length}`);
    console.log(`  Started: ${response.data.data.startedAt}`);
    console.log(`  Ended: ${response.data.data.endedAt || 'In progress'}`);
    return true;
  } else {
    console.log('✗ Failed to get workout by ID');
    return false;
  }
}

async function testLogSetForInvalidExercise() {
  console.log('\n12. Testing logging set for exercise not in program...');
  const response = await makeRequest('POST', `/api/workout-logs/${testWorkoutLogId}/sets`, {
    exerciseId: '00000000-0000-0000-0000-000000000000',
    setNumber: 1,
    weightKg: 50,
    repsCompleted: 10,
  }, studentToken);

  if (response.status === 404) {
    console.log('✓ Correctly prevented logging set for invalid exercise');
    return true;
  } else {
    console.log('✗ Should have prevented logging set for invalid exercise');
    return false;
  }
}

async function testEndWorkout() {
  console.log('\n13. Ending workout session...');
  const response = await makeRequest('PUT', `/api/workout-logs/${testWorkoutLogId}/end`, {
    notes: 'Great workout! Felt strong today.',
  }, studentToken);

  if (response.status === 200) {
    console.log('✓ Workout ended successfully');
    console.log(`  Duration: ${new Date(response.data.data.endedAt) - new Date(response.data.data.startedAt)}ms`);
    console.log(`  Total sets: ${response.data.data._count.entries}`);
    return true;
  } else {
    console.log('✗ Failed to end workout:', response.data);
    return false;
  }
}

async function testLogSetAfterWorkoutEnded() {
  console.log('\n14. Testing logging set after workout ended...');
  const exercises = await testGetExercises();
  const response = await makeRequest('POST', `/api/workout-logs/${testWorkoutLogId}/sets`, {
    exerciseId: exercises[0].id,
    setNumber: 99,
    weightKg: 50,
    repsCompleted: 10,
  }, studentToken);

  if (response.status === 400) {
    console.log('✓ Correctly prevented logging set after workout ended');
    return true;
  } else {
    console.log('✗ Should have prevented logging set after workout ended');
    return false;
  }
}

async function testUpdateSetAfterWorkoutEnded() {
  console.log('\n15. Testing updating set after workout ended...');
  const response = await makeRequest('PUT', `/api/workout-logs/${testWorkoutLogId}/sets/${testSetEntryId}`, {
    weightKg: 100,
  }, studentToken);

  if (response.status === 400) {
    console.log('✓ Correctly prevented updating set after workout ended');
    return true;
  } else {
    console.log('✗ Should have prevented updating set after workout ended');
    return false;
  }
}

async function testGetWorkoutLogs() {
  console.log('\n16. Getting workout logs list...');
  const response = await makeRequest('GET', '/api/workout-logs', null, studentToken);

  if (response.status === 200) {
    console.log(`✓ Retrieved ${response.data.data.logs.length} workout logs`);
    console.log(`  Total: ${response.data.data.pagination.total}`);
    console.log(`  Page: ${response.data.data.pagination.page}/${response.data.data.pagination.totalPages}`);
    return true;
  } else {
    console.log('✗ Failed to get workout logs');
    return false;
  }
}

async function testFilterWorkoutLogsByProgram() {
  console.log('\n17. Filtering workout logs by program...');
  const response = await makeRequest('GET', `/api/workout-logs?programId=${testProgramId}`, null, studentToken);

  if (response.status === 200) {
    console.log(`✓ Retrieved ${response.data.data.logs.length} workout logs for program`);
    const allMatch = response.data.data.logs.every(log => log.program.id === testProgramId);
    if (allMatch) {
      console.log('  ✓ All logs match the program filter');
    }
    return true;
  } else {
    console.log('✗ Failed to filter workout logs');
    return false;
  }
}

async function testGetWorkoutStats() {
  console.log('\n18. Getting workout statistics...');
  const response = await makeRequest('GET', '/api/workout-logs/stats', null, studentToken);

  if (response.status === 200) {
    console.log('✓ Workout statistics retrieved');
    console.log(`  Total workouts: ${response.data.data.totalWorkouts}`);
    console.log(`  Completed workouts: ${response.data.data.completedWorkouts}`);
    console.log(`  Active workouts: ${response.data.data.activeWorkouts}`);
    console.log(`  Total sets logged: ${response.data.data.totalSets}`);
    console.log(`  Recent workouts: ${response.data.data.recentWorkouts.length}`);
    return true;
  } else {
    console.log('✗ Failed to get workout statistics');
    return false;
  }
}

async function testDeleteSetEntry() {
  console.log('\n19. Testing set entry deletion...');

  // First, start a new workout
  const startResponse = await makeRequest('POST', '/api/workout-logs/start', {
    programId: testProgramId,
  }, studentToken);

  if (startResponse.status !== 201) {
    console.log('✗ Failed to start workout for deletion test');
    return false;
  }

  const newWorkoutId = startResponse.data.data.id;
  console.log(`  Started new workout: ${newWorkoutId}`);

  // Get exercises and log a set
  const exercises = await testGetExercises();
  const logResponse = await makeRequest('POST', `/api/workout-logs/${newWorkoutId}/sets`, {
    exerciseId: exercises[0].id,
    setNumber: 1,
    weightKg: 50,
    repsCompleted: 10,
  }, studentToken);

  if (logResponse.status !== 201) {
    console.log('✗ Failed to log set for deletion test');
    return false;
  }

  const setId = logResponse.data.data.id;
  console.log(`  Logged set: ${setId}`);

  // Now delete it
  const deleteResponse = await makeRequest('DELETE', `/api/workout-logs/${newWorkoutId}/sets/${setId}`, null, studentToken);

  if (deleteResponse.status === 200) {
    console.log('✓ Set entry deleted successfully');

    // End the workout and cleanup
    await makeRequest('PUT', `/api/workout-logs/${newWorkoutId}/end`, {}, studentToken);
    return true;
  } else {
    console.log('✗ Failed to delete set entry:', deleteResponse.data);
    return false;
  }
}

async function testValidationErrors() {
  console.log('\n20. Testing validation errors...');

  // Invalid programId
  const response1 = await makeRequest('POST', '/api/workout-logs/start', {
    programId: 'invalid-uuid',
  }, studentToken);

  if (response1.status === 400) {
    console.log('  ✓ Invalid program ID rejected');
  } else {
    console.log('  ✗ Should reject invalid program ID');
  }

  // Missing required fields
  const response2 = await makeRequest('POST', `/api/workout-logs/${testWorkoutLogId}/sets`, {
    setNumber: 1,
  }, studentToken);

  if (response2.status === 400) {
    console.log('  ✓ Missing required fields rejected');
  } else {
    console.log('  ✗ Should reject missing required fields');
  }

  // Invalid RPE value
  const exercises = await testGetExercises();
  const response3 = await makeRequest('POST', '/api/workout-logs/start', {
    programId: testProgramId,
  }, studentToken);

  if (response3.status === 201) {
    const newWorkoutId = response3.data.data.id;
    const response4 = await makeRequest('POST', `/api/workout-logs/${newWorkoutId}/sets`, {
      exerciseId: exercises[0].id,
      setNumber: 1,
      repsCompleted: 10,
      rpe: 15, // Invalid: should be 1-10
    }, studentToken);

    if (response4.status === 400) {
      console.log('  ✓ Invalid RPE value rejected');
    } else {
      console.log('  ✗ Should reject invalid RPE value');
    }

    // Cleanup
    await makeRequest('PUT', `/api/workout-logs/${newWorkoutId}/end`, {}, studentToken);
  }

  console.log('✓ Validation errors tested');
  return true;
}

async function cleanupTestData() {
  console.log('\n21. Cleaning up test data...');

  // Delete test program (which will cascade to workout logs via soft delete)
  const response = await makeRequest('DELETE', `/api/programs/${testProgramId}`, null, authToken);

  if (response.status === 200) {
    console.log('✓ Test data cleaned up successfully');
    return true;
  } else {
    console.log('⚠ Failed to cleanup test data (non-critical)');
    return true; // Don't fail the test suite for cleanup issues
  }
}

// Main test runner
async function runTests() {
  console.log('=================================');
  console.log('Workout Logging API Tests');
  console.log('=================================');

  try {
    // Setup
    if (!await testLogin()) return;
    if (!await testGetStudentUser()) return;
    if (!await testLoginAsStudent()) return;

    const exercises = await testGetExercises();
    if (exercises.length === 0) return;

    if (!await testCreateProgram(exercises)) return;

    // Workout logging tests
    if (!await testStartWorkout()) return;
    if (!await testStartWorkoutWithActiveWorkout()) return;
    if (!await testGetActiveWorkout()) return;

    // Log multiple sets
    for (let i = 1; i <= 3; i++) {
      if (!await testLogSet(exercises[0].id, i, 60 + (i * 2.5), 10 + i, 7 + i)) return;
    }

    if (!await testUpdateSetEntry()) return;
    if (!await testGetWorkoutById()) return;
    if (!await testLogSetForInvalidExercise()) return;
    if (!await testEndWorkout()) return;
    if (!await testLogSetAfterWorkoutEnded()) return;
    if (!await testUpdateSetAfterWorkoutEnded()) return;
    if (!await testGetWorkoutLogs()) return;
    if (!await testFilterWorkoutLogsByProgram()) return;
    if (!await testGetWorkoutStats()) return;
    if (!await testDeleteSetEntry()) return;
    if (!await testValidationErrors()) return;

    // Cleanup
    await cleanupTestData();

    console.log('\n=================================');
    console.log('✓ All tests passed!');
    console.log('=================================\n');
  } catch (error) {
    console.error('\n✗ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
