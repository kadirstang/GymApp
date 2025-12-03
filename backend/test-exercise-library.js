#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let exerciseId = '';
let equipmentId = '';

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

async function test2_GetEquipmentId() {
  logTest('2. Get Equipment ID (for equipment association)');

  // First check if equipment exists
  const listResponse = await makeRequest('GET', '/api/gyms?limit=1', null, authToken);

  if (listResponse.status === 200 && listResponse.data?.data?.[0]?._count?.equipments > 0) {
    // Get first equipment from seed data
    const response = await makeRequest('GET', '/prisma/equipment?limit=1', null, authToken);

    if (response.data?.length > 0) {
      equipmentId = response.data[0].id;
      console.log(`✅ Found equipment: ${equipmentId}`);
    } else {
      console.log('⚠️  No equipment found, will test without equipment association');
    }
  } else {
    console.log('⚠️  No equipment found, will test without equipment association');
  }
}

async function test3_CreateExercise() {
  logTest('3. Create Exercise - Incline Bench Press');
  const response = await makeRequest('POST', '/api/exercises', {
    name: 'Incline Bench Press',
    description: 'Upper chest compound exercise',
    videoUrl: 'https://youtube.com/watch?v=incline-bench-press',
    targetMuscleGroup: 'Chest',
    equipmentNeededId: equipmentId || null
  }, authToken);
  logResult(response);

  if (response.status === 201) {
    exerciseId = response.data.data.id;
    console.log('✅ Exercise created successfully');
    console.log(`Exercise ID: ${exerciseId}`);
  } else {
    console.error('❌ Failed to create exercise');
  }
}

async function test4_CreateExercise2() {
  logTest('4. Create Exercise - Front Squat');
  const response = await makeRequest('POST', '/api/exercises', {
    name: 'Front Squat',
    description: 'Quad-focused leg exercise',
    videoUrl: 'https://youtube.com/watch?v=front-squat',
    targetMuscleGroup: 'Legs',
    equipmentNeededId: null
  }, authToken);
  logResult(response);

  if (response.status === 201) {
    console.log('✅ Exercise created successfully');
  }
}

async function test5_CreateExercise3() {
  logTest('5. Create Exercise - Chin-up');
  const response = await makeRequest('POST', '/api/exercises', {
    name: 'Chin-up',
    description: 'Bodyweight back and biceps exercise',
    videoUrl: 'https://youtube.com/watch?v=chinup',
    targetMuscleGroup: 'Back'
  }, authToken);
  logResult(response);

  if (response.status === 201) {
    console.log('✅ Exercise created successfully');
  }
}

async function test6_GetAllExercises() {
  logTest('6. Get All Exercises');
  const response = await makeRequest('GET', '/api/exercises', null, authToken);
  logResult(response);

  if (response.status === 200) {
    const count = response.data?.data?.exercises?.length || 0;
    console.log(`✅ Successfully retrieved ${count} exercise(s)`);
  }
}

async function test7_GetExerciseById() {
  logTest('7. Get Exercise by ID');
  const response = await makeRequest('GET', `/api/exercises/${exerciseId}`, null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully retrieved exercise details');
  }
}

async function test8_SearchExercises() {
  logTest('8. Search Exercises - "press"');
  const response = await makeRequest('GET', '/api/exercises?search=press', null, authToken);
  logResult(response);

  if (response.status === 200) {
    const count = response.data?.data?.exercises?.length || 0;
    console.log(`✅ Found ${count} exercise(s) matching "press"`);
  }
}

async function test9_FilterByMuscleGroup() {
  logTest('9. Filter Exercises by Muscle Group - "Chest"');
  const response = await makeRequest('GET', '/api/exercises?targetMuscleGroup=Chest', null, authToken);
  logResult(response);

  if (response.status === 200) {
    const count = response.data?.data?.exercises?.length || 0;
    console.log(`✅ Found ${count} chest exercise(s)`);
  }
}

async function test10_GetMuscleGroups() {
  logTest('10. Get Muscle Groups List');
  const response = await makeRequest('GET', '/api/exercises/muscle-groups', null, authToken);
  logResult(response);

  if (response.status === 200) {
    const count = response.data?.data?.total || 0;
    console.log(`✅ Found ${count} unique muscle group(s)`);
  }
}

async function test11_GetExerciseStats() {
  logTest('11. Get Exercise Statistics');
  const response = await makeRequest('GET', '/api/exercises/stats', null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully retrieved exercise statistics');
  }
}

async function test12_UpdateExercise() {
  logTest('12. Update Exercise');
  const response = await makeRequest('PUT', `/api/exercises/${exerciseId}`, {
    name: 'Incline Dumbbell Bench Press',
    description: 'Upper chest compound exercise with dumbbells',
    targetMuscleGroup: 'Chest'
  }, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Exercise updated successfully');
  }
}

async function test13_DuplicateExerciseName() {
  logTest('13. Try to Create Duplicate Exercise Name (should fail)');
  const response = await makeRequest('POST', '/api/exercises', {
    name: 'Incline Dumbbell Bench Press',
    description: 'Another incline dumbbell bench press',
    targetMuscleGroup: 'Chest'
  }, authToken);
  logResult(response);

  if (response.status === 409) {
    console.log('✅ Correctly rejected duplicate exercise name');
  } else {
    console.error('❌ Should have rejected duplicate exercise name');
  }
}

async function test14_InvalidExerciseId() {
  logTest('14. Get Exercise with Invalid ID (should fail)');
  const response = await makeRequest('GET', '/api/exercises/invalid-uuid', null, authToken);
  logResult(response);

  if (response.status === 400) {
    console.log('✅ Correctly rejected invalid UUID');
  } else {
    console.error('❌ Should have rejected invalid UUID');
  }
}

async function test15_Pagination() {
  logTest('15. Test Pagination - Page 1, Limit 2');
  const response = await makeRequest('GET', '/api/exercises?page=1&limit=2', null, authToken);
  logResult(response);

  if (response.status === 200) {
    const exercises = response.data?.data?.exercises || [];
    const pagination = response.data?.data?.pagination || {};
    console.log(`✅ Retrieved ${exercises.length} exercise(s)`);
    console.log(`Pagination: ${pagination.page}/${pagination.totalPages} pages`);
  }
}

async function test16_DeleteExercise() {
  logTest('16. Delete Exercise');
  const response = await makeRequest('DELETE', `/api/exercises/${exerciseId}`, null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Exercise deleted successfully');
  }
}

async function test17_VerifyDeleted() {
  logTest('17. Verify Exercise Was Deleted');
  const response = await makeRequest('GET', `/api/exercises/${exerciseId}`, null, authToken);
  logResult(response);

  if (response.status === 404) {
    console.log('✅ Exercise correctly not found after deletion');
  } else {
    console.error('❌ Exercise should not be accessible after deletion');
  }
}

async function test18_ValidationErrors() {
  logTest('18. Test Validation Errors - Empty Name');
  const response = await makeRequest('POST', '/api/exercises', {
    name: '',
    targetMuscleGroup: 'Chest'
  }, authToken);
  logResult(response);

  if (response.status === 400) {
    console.log('✅ Correctly rejected empty name');
  } else {
    console.error('❌ Should have rejected empty name');
  }
}

async function cleanup() {
  logTest('0. Cleanup - Delete test exercises from previous runs');

  const exercisesToDelete = ['Incline Bench Press', 'Front Squat', 'Chin-up', 'Incline Dumbbell Bench Press'];

  for (const name of exercisesToDelete) {
    const listResponse = await makeRequest('GET', `/api/exercises?search=${encodeURIComponent(name)}`, null, authToken);

    if (listResponse.status === 200 && listResponse.data?.data?.exercises) {
      for (const exercise of listResponse.data.data.exercises) {
        if (exercise.name === name) {
          await makeRequest('DELETE', `/api/exercises/${exercise.id}`, null, authToken);
          console.log(`Deleted: ${name}`);
        }
      }
    }
  }

  console.log('✅ Cleanup completed');
}

async function runTests() {
  console.log('\n🧪 Testing Exercise Library API');
  console.log('========================================\n');

  try {
    await test1_Login();
    await cleanup();
    await test2_GetEquipmentId();
    await test3_CreateExercise();
    await test4_CreateExercise2();
    await test5_CreateExercise3();
    await test6_GetAllExercises();
    await test7_GetExerciseById();
    await test8_SearchExercises();
    await test9_FilterByMuscleGroup();
    await test10_GetMuscleGroups();
    await test11_GetExerciseStats();
    await test12_UpdateExercise();
    await test14_InvalidExerciseId();
    await test15_Pagination();
    await test13_DuplicateExerciseName();
    await test16_DeleteExercise();
    await test17_VerifyDeleted();
    await test18_ValidationErrors();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All exercise library tests completed!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    process.exit(1);
  }
}

runTests();
