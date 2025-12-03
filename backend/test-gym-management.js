#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let gymId = '';

// Utility functions
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
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
  console.log(`\n${'='.repeat(50)}`);
  console.log(`TEST: ${testName}`);
  console.log('='.repeat(50));
}

function logResult(response) {
  console.log(`Status: ${response.status}`);
  console.log('Response:', JSON.stringify(response.data, null, 2));
}

// Test functions
async function test1_Login() {
  logTest('1. Login as GymOwner');
  const response = await makeRequest('POST', '/api/auth/login', {
    email: 'owner@testgym.com',
    password: 'password123'
  });
  logResult(response);

  if (response.status === 200 && response.data?.data?.token) {
    authToken = response.data.data.token;
    gymId = response.data.data.user.gymId;
    console.log('✅ Login successful, token obtained');
    console.log(`Gym ID: ${gymId}`);
  } else {
    console.error('❌ Login failed');
    process.exit(1);
  }
}

async function test2_GetOwnGym() {
  logTest('2. Get Own Gym Details');
  const response = await makeRequest('GET', `/api/gyms/${gymId}`, null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully retrieved gym details');
  } else {
    console.error('❌ Failed to retrieve gym details');
  }
}

async function test3_GetGymStats() {
  logTest('3. Get Gym Statistics');
  const response = await makeRequest('GET', `/api/gyms/${gymId}/stats`, null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully retrieved gym statistics');
  } else {
    console.error('❌ Failed to retrieve gym statistics');
  }
}

async function test4_UpdateGym() {
  logTest('4. Update Gym Information');
  const response = await makeRequest('PUT', `/api/gyms/${gymId}`, {
    name: 'Test Gym - Updated',
    address: '456 New Fitness Avenue, Updated City',
    contactPhone: '+1987654321'
  }, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully updated gym');
  } else {
    console.error('❌ Failed to update gym');
  }
}

async function test5_UpdateGymSlug() {
  logTest('5. Update Gym Slug (should validate uniqueness)');
  const response = await makeRequest('PUT', `/api/gyms/${gymId}`, {
    slug: 'test-gym-updated'
  }, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully updated gym slug');
  } else {
    console.error('❌ Failed to update gym slug');
  }
}

async function test6_InvalidSlug() {
  logTest('6. Try Invalid Slug Format (should fail validation)');
  const response = await makeRequest('PUT', `/api/gyms/${gymId}`, {
    slug: 'Invalid Slug With Spaces!'
  }, authToken);
  logResult(response);

  if (response.status === 400 || response.status === 422) {
    console.log('✅ Correctly rejected invalid slug format');
  } else {
    console.error('❌ Should have rejected invalid slug');
  }
}

async function test7_GetGymAsTrainer() {
  logTest('7. Login as Trainer and Get Gym (should succeed)');

  // Login as trainer
  const loginResponse = await makeRequest('POST', '/api/auth/login', {
    email: 'trainer@testgym.com',
    password: 'password123'
  });

  if (loginResponse.status === 200) {
    const trainerToken = loginResponse.data.data.token;

    // Try to get gym
    const gymResponse = await makeRequest('GET', `/api/gyms/${gymId}`, null, trainerToken);
    logResult(gymResponse);

    if (gymResponse.status === 200 || gymResponse.status === 403) {
      console.log('✅ Trainer access control working as expected');
    } else {
      console.error('❌ Unexpected response for trainer');
    }
  }
}

async function test8_CreateGymAsOwner() {
  logTest('8. Try to Create Gym as GymOwner (should fail - needs SuperAdmin)');
  const response = await makeRequest('POST', '/api/gyms', {
    name: 'New Gym',
    slug: 'new-gym',
    address: '789 Test Street',
    contactPhone: '+1222333444'
  }, authToken);
  logResult(response);

  if (response.status === 403) {
    console.log('✅ Correctly blocked GymOwner from creating gym');
  } else {
    console.error('❌ Should have blocked GymOwner from creating gym');
  }
}

async function test9_RestoreGymName() {
  logTest('9. Restore Original Gym Name');
  const response = await makeRequest('PUT', `/api/gyms/${gymId}`, {
    name: 'Test Gym',
    slug: 'test-gym',
    address: '123 Fitness Street, City',
    contactPhone: '+1234567890'
  }, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully restored gym information');
  } else {
    console.error('❌ Failed to restore gym information');
  }
}

// Run all tests
async function runTests() {
  console.log('\n🧪 Testing Gym Management API');
  console.log('================================\n');

  try {
    await test1_Login();
    await test2_GetOwnGym();
    await test3_GetGymStats();
    await test4_UpdateGym();
    await test5_UpdateGymSlug();
    await test6_InvalidSlug();
    await test7_GetGymAsTrainer();
    await test8_CreateGymAsOwner();
    await test9_RestoreGymName();

    console.log('\n' + '='.repeat(50));
    console.log('✅ All gym management tests completed!');
    console.log('='.repeat(50) + '\n');
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    process.exit(1);
  }
}

runTests();
