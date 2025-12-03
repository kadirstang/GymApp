#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let createdRoleId = '';

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
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testName}`);
  console.log('='.repeat(60));
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
    console.log('✅ Login successful, token obtained');
  } else {
    console.error('❌ Login failed');
    process.exit(1);
  }
}

async function test2_GetAllRoles() {
  logTest('2. Get All Roles for Gym');
  const response = await makeRequest('GET', '/api/roles', null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully retrieved roles');
    const roles = response.data?.data?.roles || [];
    console.log(`Found ${roles.length} roles`);
  } else {
    console.error('❌ Failed to retrieve roles');
  }
}

async function test3_GetRoleTemplates() {
  logTest('3. Get Role Templates');
  const response = await makeRequest('GET', '/api/roles/templates', null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully retrieved role templates');
  } else {
    console.error('❌ Failed to retrieve templates');
  }
}

async function test4_CreateCustomRole() {
  logTest('4. Create Custom Role');
  const response = await makeRequest('POST', '/api/roles', {
    name: 'Nutritionist',
    permissions: {
      users: { read: true },
      students: { read: true, update: true },
      products: { read: true }
    }
  }, authToken);
  logResult(response);

  if (response.status === 201) {
    createdRoleId = response.data.data.id;
    console.log('✅ Successfully created custom role');
    console.log(`Role ID: ${createdRoleId}`);
  } else {
    console.error('❌ Failed to create role');
  }
}

async function test5_GetRoleById() {
  logTest('5. Get Role by ID');
  const response = await makeRequest('GET', `/api/roles/${createdRoleId}`, null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully retrieved role details');
  } else {
    console.error('❌ Failed to retrieve role');
  }
}

async function test6_UpdateRole() {
  logTest('6. Update Role Permissions');
  const response = await makeRequest('PUT', `/api/roles/${createdRoleId}`, {
    permissions: {
      users: { read: true },
      students: { read: true, update: true },
      products: { read: true, create: true },
      orders: { read: true }
    }
  }, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully updated role');
  } else {
    console.error('❌ Failed to update role');
  }
}

async function test7_CreateRoleFromTemplate() {
  logTest('7. Create Role from Template');
  const response = await makeRequest('POST', '/api/roles/from-template', {
    templateName: 'Receptionist',
    customName: 'Front Desk Staff'
  }, authToken);
  logResult(response);

  if (response.status === 201) {
    console.log('✅ Successfully created role from template');
  } else {
    console.error('❌ Failed to create role from template');
  }
}

async function test8_CreateDuplicateRole() {
  logTest('8. Try to Create Duplicate Role (should fail)');
  const response = await makeRequest('POST', '/api/roles', {
    name: 'Nutritionist',
    permissions: {}
  }, authToken);
  logResult(response);

  if (response.status === 409) {
    console.log('✅ Correctly rejected duplicate role name');
  } else {
    console.error('❌ Should have rejected duplicate role');
  }
}

async function test9_TryRenameSystemRole() {
  logTest('9. Try to Rename System Role (should fail)');

  // First, get GymOwner role ID
  const rolesResponse = await makeRequest('GET', '/api/roles', null, authToken);
  const gymOwnerRole = rolesResponse.data?.data?.roles?.find(r => r.name === 'GymOwner');

  if (!gymOwnerRole) {
    console.log('⚠️  GymOwner role not found, skipping test');
    return;
  }

  const response = await makeRequest('PUT', `/api/roles/${gymOwnerRole.id}`, {
    name: 'SuperOwner'
  }, authToken);
  logResult(response);

  if (response.status === 400) {
    console.log('✅ Correctly blocked renaming of system role');
  } else {
    console.error('❌ Should have blocked renaming system role');
  }
}

async function test10_TryDeleteSystemRole() {
  logTest('10. Try to Delete System Role (should fail)');

  // Get Student role ID
  const rolesResponse = await makeRequest('GET', '/api/roles', null, authToken);
  const studentRole = rolesResponse.data?.data?.roles?.find(r => r.name === 'Student');

  if (!studentRole) {
    console.log('⚠️  Student role not found, skipping test');
    return;
  }

  const response = await makeRequest('DELETE', `/api/roles/${studentRole.id}`, null, authToken);
  logResult(response);

  if (response.status === 400) {
    console.log('✅ Correctly blocked deletion of system role');
  } else {
    console.error('❌ Should have blocked deletion of system role');
  }
}

async function test11_DeleteCustomRole() {
  logTest('11. Delete Custom Role');
  const response = await makeRequest('DELETE', `/api/roles/${createdRoleId}`, null, authToken);
  logResult(response);

  if (response.status === 200) {
    console.log('✅ Successfully deleted custom role');
  } else {
    console.error('❌ Failed to delete role');
  }
}

async function test12_VerifyRoleDeleted() {
  logTest('12. Verify Role Was Deleted');
  const response = await makeRequest('GET', `/api/roles/${createdRoleId}`, null, authToken);
  logResult(response);

  if (response.status === 404) {
    console.log('✅ Role correctly not found after deletion');
  } else {
    console.error('❌ Role should not be accessible after deletion');
  }
}

async function test13_TrainerAccessControl() {
  logTest('13. Login as Trainer and Try to Create Role (should fail)');

  // Login as trainer
  const loginResponse = await makeRequest('POST', '/api/auth/login', {
    email: 'trainer@testgym.com',
    password: 'password123'
  });

  if (loginResponse.status === 200) {
    const trainerToken = loginResponse.data.data.token;

    // Try to create role
    const roleResponse = await makeRequest('POST', '/api/roles', {
      name: 'Test Role',
      permissions: {}
    }, trainerToken);
    logResult(roleResponse);

    if (roleResponse.status === 403) {
      console.log('✅ Correctly blocked Trainer from creating role');
    } else {
      console.error('❌ Should have blocked Trainer from creating role');
    }
  }
}

// Run all tests
async function runTests() {
  console.log('\n🧪 Testing Role Management API');
  console.log('================================\n');

  try {
    await test1_Login();
    await test2_GetAllRoles();
    await test3_GetRoleTemplates();
    await test4_CreateCustomRole();
    await test5_GetRoleById();
    await test6_UpdateRole();
    await test7_CreateRoleFromTemplate();
    await test8_CreateDuplicateRole();
    await test9_TryRenameSystemRole();
    await test10_TryDeleteSystemRole();
    await test11_DeleteCustomRole();
    await test12_VerifyRoleDeleted();
    await test13_TrainerAccessControl();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All role management tests completed!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    process.exit(1);
  }
}

runTests();
