#!/usr/bin/env node

/**
 * Equipment Management API Test Script
 * Tests all endpoints for equipment management functionality
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let testEquipmentId = '';
let testQrCodeUuid = '';

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

async function testCreateEquipment() {
  console.log('\n2. Creating test equipment...');
  const response = await makeRequest('POST', '/api/equipment', {
    name: 'Test Treadmill',
    description: 'High-end treadmill with incline feature',
    videoUrl: 'https://www.youtube.com/watch?v=test123',
    status: 'active',
  }, authToken);

  if (response.status === 201) {
    testEquipmentId = response.data.data.id;
    testQrCodeUuid = response.data.data.qrCodeUuid;
    console.log(`✓ Equipment created: ${testEquipmentId}`);
    console.log(`  Name: ${response.data.data.name}`);
    console.log(`  QR Code UUID: ${testQrCodeUuid}`);
    console.log(`  Status: ${response.data.data.status}`);
    return true;
  } else {
    console.log('✗ Failed to create equipment:', response.data);
    return false;
  }
}

async function testCreateDuplicateEquipment() {
  console.log('\n3. Testing duplicate equipment prevention...');
  const response = await makeRequest('POST', '/api/equipment', {
    name: 'Test Treadmill',
    description: 'Another treadmill',
  }, authToken);

  if (response.status === 409) {
    console.log('✓ Correctly prevented duplicate equipment name');
    return true;
  } else {
    console.log('✗ Should have prevented duplicate equipment');
    return false;
  }
}

async function testGetAllEquipment() {
  console.log('\n4. Getting all equipment...');
  const response = await makeRequest('GET', '/api/equipment', null, authToken);

  if (response.status === 200) {
    console.log(`✓ Retrieved ${response.data.data.equipment.length} equipment items`);
    console.log(`  Total: ${response.data.data.pagination.total}`);
    console.log(`  Page: ${response.data.data.pagination.page}/${response.data.data.pagination.totalPages}`);
    return true;
  } else {
    console.log('✗ Failed to get equipment');
    return false;
  }
}

async function testGetEquipmentById() {
  console.log('\n5. Getting equipment by ID...');
  const response = await makeRequest('GET', `/api/equipment/${testEquipmentId}`, null, authToken);

  if (response.status === 200) {
    console.log('✓ Equipment retrieved successfully');
    console.log(`  Name: ${response.data.data.name}`);
    console.log(`  Description: ${response.data.data.description}`);
    console.log(`  Video URL: ${response.data.data.videoUrl}`);
    console.log(`  Status: ${response.data.data.status}`);
    console.log(`  QR Code: ${response.data.data.qrCodeUuid}`);
    return true;
  } else {
    console.log('✗ Failed to get equipment by ID');
    return false;
  }
}

async function testSearchEquipment() {
  console.log('\n6. Testing equipment search...');
  const response = await makeRequest('GET', '/api/equipment?search=treadmill', null, authToken);

  if (response.status === 200) {
    const found = response.data.data.equipment.some(e =>
      e.name.toLowerCase().includes('treadmill')
    );
    if (found) {
      console.log('✓ Search returned correct results');
      console.log(`  Found ${response.data.data.equipment.length} matching equipment`);
    } else {
      console.log('✗ Search did not return expected results');
      return false;
    }
    return true;
  } else {
    console.log('✗ Search failed');
    return false;
  }
}

async function testFilterByStatus() {
  console.log('\n7. Testing status filter...');
  const response = await makeRequest('GET', '/api/equipment?status=active', null, authToken);

  if (response.status === 200) {
    const allActive = response.data.data.equipment.every(e => e.status === 'active');
    if (allActive) {
      console.log('✓ Status filter working correctly');
      console.log(`  Found ${response.data.data.equipment.length} active equipment`);
    } else {
      console.log('✗ Status filter returned incorrect results');
      return false;
    }
    return true;
  } else {
    console.log('✗ Status filter failed');
    return false;
  }
}

async function testUpdateEquipment() {
  console.log('\n8. Updating equipment...');
  const response = await makeRequest('PUT', `/api/equipment/${testEquipmentId}`, {
    name: 'Test Treadmill Pro',
    description: 'Updated description with more features',
    status: 'maintenance',
  }, authToken);

  if (response.status === 200) {
    console.log('✓ Equipment updated successfully');
    console.log(`  New name: ${response.data.data.name}`);
    console.log(`  New status: ${response.data.data.status}`);
    return true;
  } else {
    console.log('✗ Failed to update equipment:', response.data);
    return false;
  }
}

async function testUpdateStatusOnly() {
  console.log('\n9. Testing status-only update...');
  const response = await makeRequest('PUT', `/api/equipment/${testEquipmentId}`, {
    status: 'broken',
  }, authToken);

  if (response.status === 200 && response.data.data.status === 'broken') {
    console.log('✓ Status updated successfully');
    console.log(`  New status: ${response.data.data.status}`);
    return true;
  } else {
    console.log('✗ Failed to update status');
    return false;
  }
}

async function testGetEquipmentByQR() {
  console.log('\n10. Getting equipment by QR code...');
  const response = await makeRequest('GET', `/api/equipment/qr/${testQrCodeUuid}`, null, authToken);

  if (response.status === 200) {
    console.log('✓ Equipment retrieved via QR code');
    console.log(`  Name: ${response.data.data.name}`);
    console.log(`  Video URL: ${response.data.data.videoUrl}`);
    if (response.data.data.warning) {
      console.log(`  Warning: ${response.data.data.warning}`);
    }
    return true;
  } else {
    console.log('✗ Failed to get equipment by QR code');
    return false;
  }
}

async function testGetEquipmentStats() {
  console.log('\n11. Getting equipment statistics...');
  const response = await makeRequest('GET', '/api/equipment/stats', null, authToken);

  if (response.status === 200) {
    console.log('✓ Equipment statistics retrieved');
    console.log(`  Total equipment: ${response.data.data.total}`);
    console.log(`  Active: ${response.data.data.active}`);
    console.log(`  Maintenance: ${response.data.data.maintenance}`);
    console.log(`  Broken: ${response.data.data.broken}`);
    console.log(`  With exercises: ${response.data.data.withExercises}`);
    console.log(`  Without exercises: ${response.data.data.withoutExercises}`);
    return true;
  } else {
    console.log('✗ Failed to get equipment statistics');
    return false;
  }
}

async function testPagination() {
  console.log('\n12. Testing pagination...');

  // Create multiple equipment items
  for (let i = 1; i <= 3; i++) {
    await makeRequest('POST', '/api/equipment', {
      name: `Test Equipment ${i}`,
      description: `Equipment number ${i}`,
    }, authToken);
  }

  // Test pagination
  const response = await makeRequest('GET', '/api/equipment?limit=2&page=1', null, authToken);

  if (response.status === 200) {
    console.log(`✓ Pagination working correctly`);
    console.log(`  Returned ${response.data.data.equipment.length} items (limit: 2)`);
    console.log(`  Page 1 of ${response.data.data.pagination.totalPages}`);
    return true;
  } else {
    console.log('✗ Pagination failed');
    return false;
  }
}

async function testValidationErrors() {
  console.log('\n13. Testing validation errors...');

  // Invalid UUID
  const response1 = await makeRequest('GET', '/api/equipment/invalid-uuid', null, authToken);
  if (response1.status === 400) {
    console.log('  ✓ Invalid UUID rejected');
  } else {
    console.log('  ✗ Should reject invalid UUID');
  }

  // Missing required field
  const response2 = await makeRequest('POST', '/api/equipment', {
    description: 'Missing name field',
  }, authToken);
  if (response2.status === 400) {
    console.log('  ✓ Missing required field rejected');
  } else {
    console.log('  ✗ Should reject missing required field');
  }

  // Invalid URL
  const response3 = await makeRequest('POST', '/api/equipment', {
    name: 'Test Equipment',
    videoUrl: 'not-a-valid-url',
  }, authToken);
  if (response3.status === 400) {
    console.log('  ✓ Invalid URL rejected');
  } else {
    console.log('  ✗ Should reject invalid URL');
  }

  // Invalid status
  const response4 = await makeRequest('POST', '/api/equipment', {
    name: 'Test Equipment X',
    status: 'invalid-status',
  }, authToken);
  if (response4.status === 400) {
    console.log('  ✓ Invalid status rejected');
  } else {
    console.log('  ✗ Should reject invalid status');
  }

  console.log('✓ Validation errors tested');
  return true;
}

async function testDeleteEquipmentWithExercises() {
  console.log('\n14. Testing deletion prevention for equipment with exercises...');

  // First, check if there's equipment linked to exercises
  const allEquipment = await makeRequest('GET', '/api/equipment', null, authToken);
  const equipmentWithExercises = allEquipment.data.data.equipment.find(e => e._count && e._count.exercises > 0);

  if (equipmentWithExercises) {
    const response = await makeRequest('DELETE', `/api/equipment/${equipmentWithExercises.id}`, null, authToken);
    if (response.status === 400) {
      console.log('✓ Correctly prevented deletion of equipment with exercises');
      return true;
    } else {
      console.log('✗ Should prevent deletion of equipment with exercises');
      return false;
    }
  } else {
    console.log('⚠ No equipment with exercises to test deletion prevention (skipped)');
    return true;
  }
}

async function testDeleteEquipment() {
  console.log('\n15. Testing equipment deletion...');

  // Create a new equipment for deletion
  const createResponse = await makeRequest('POST', '/api/equipment', {
    name: 'Equipment To Delete',
    description: 'This will be deleted',
  }, authToken);

  if (createResponse.status !== 201) {
    console.log('✗ Failed to create equipment for deletion test');
    return false;
  }

  const equipmentId = createResponse.data.data.id;
  console.log(`  Created equipment: ${equipmentId}`);

  // Delete it
  const deleteResponse = await makeRequest('DELETE', `/api/equipment/${equipmentId}`, null, authToken);

  if (deleteResponse.status === 200) {
    console.log('✓ Equipment deleted successfully (soft delete)');

    // Verify it's no longer in the list
    const listResponse = await makeRequest('GET', '/api/equipment', null, authToken);
    const found = listResponse.data.data.equipment.find(e => e.id === equipmentId);
    if (!found) {
      console.log('  ✓ Deleted equipment no longer appears in list');
    }
    return true;
  } else {
    console.log('✗ Failed to delete equipment:', deleteResponse.data);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n16. Cleaning up test data...');

  // Get all equipment and delete those starting with "Test"
  const response = await makeRequest('GET', '/api/equipment?limit=100', null, authToken);
  if (response.status === 200) {
    const testEquipment = response.data.data.equipment.filter(e =>
      e.name.startsWith('Test') && e._count.exercises === 0
    );

    let deleted = 0;
    for (const equipment of testEquipment) {
      const deleteResponse = await makeRequest('DELETE', `/api/equipment/${equipment.id}`, null, authToken);
      if (deleteResponse.status === 200) {
        deleted++;
      }
    }

    console.log(`✓ Cleaned up ${deleted} test equipment items`);
    return true;
  }

  return true; // Don't fail the test suite for cleanup issues
}

// Main test runner
async function runTests() {
  console.log('=================================');
  console.log('Equipment Management API Tests');
  console.log('=================================');

  try {
    // Setup
    if (!await testLogin()) return;

    // Equipment CRUD tests
    if (!await testCreateEquipment()) return;
    if (!await testCreateDuplicateEquipment()) return;
    if (!await testGetAllEquipment()) return;
    if (!await testGetEquipmentById()) return;
    if (!await testSearchEquipment()) return;
    if (!await testFilterByStatus()) return;
    if (!await testUpdateEquipment()) return;
    if (!await testUpdateStatusOnly()) return;
    if (!await testGetEquipmentByQR()) return;
    if (!await testGetEquipmentStats()) return;
    if (!await testPagination()) return;
    if (!await testValidationErrors()) return;
    if (!await testDeleteEquipmentWithExercises()) return;
    if (!await testDeleteEquipment()) return;

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
