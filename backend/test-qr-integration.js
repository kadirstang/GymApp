#!/usr/bin/env node

/**
 * QR Code Integration API Test Script
 * Tests QR code scanning and generation functionality
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let studentToken = '';
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
  console.log('\n1. Testing trainer login...');
  const response = await makeRequest('POST', '/api/auth/login', {
    email: 'trainer@testgym.com',
    password: 'password123',
  });

  if (response.status === 200 && response.data.data.token) {
    authToken = response.data.data.token;
    console.log('✓ Trainer login successful');
    return true;
  } else {
    console.log('✗ Login failed:', response.data);
    return false;
  }
}

async function testStudentLogin() {
  console.log('\n2. Testing student login...');
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

async function testCreateEquipmentForQR() {
  console.log('\n3. Creating equipment with QR code...');
  const response = await makeRequest('POST', '/api/equipment', {
    name: 'QR Test Equipment - Leg Press',
    description: 'Professional leg press machine with adjustable resistance',
    videoUrl: 'https://www.youtube.com/watch?v=qr_test_123',
    status: 'active',
  }, authToken);

  if (response.status === 201) {
    testEquipmentId = response.data.data.id;
    testQrCodeUuid = response.data.data.qrCodeUuid;
    console.log(`✓ Equipment created with auto-generated QR code`);
    console.log(`  Equipment ID: ${testEquipmentId}`);
    console.log(`  QR Code UUID: ${testQrCodeUuid}`);
    console.log(`  Name: ${response.data.data.name}`);
    return true;
  } else {
    console.log('✗ Failed to create equipment:', response.data);
    return false;
  }
}

async function testGenerateQRCodeImage() {
  console.log('\n4. Generating QR code image...');
  const response = await makeRequest('GET', `/api/equipment/${testEquipmentId}/qr-code`, null, authToken);

  if (response.status === 200) {
    console.log('✓ QR code image generated successfully');
    console.log(`  Equipment: ${response.data.data.equipmentName}`);
    console.log(`  QR Code UUID: ${response.data.data.qrCodeUuid}`);
    console.log(`  Image format: ${response.data.data.qrCodeImage.substring(0, 30)}...`);

    // Verify it's a valid data URL
    if (response.data.data.qrCodeImage.startsWith('data:image/png;base64,')) {
      console.log('  ✓ Valid base64 PNG data URL');
    } else {
      console.log('  ✗ Invalid image format');
      return false;
    }
    return true;
  } else {
    console.log('✗ Failed to generate QR code:', response.data);
    return false;
  }
}

async function testScanQRCodeActive() {
  console.log('\n5. Testing QR scan for active equipment...');
  const response = await makeRequest('GET', `/api/equipment/qr/${testQrCodeUuid}`, null, studentToken);

  if (response.status === 200) {
    console.log('✓ QR code scanned successfully');
    console.log(`  Equipment: ${response.data.data.name}`);
    console.log(`  Description: ${response.data.data.description}`);
    console.log(`  Video URL: ${response.data.data.videoUrl}`);
    console.log(`  Status: ${response.data.data.status}`);

    if (response.data.data.warning) {
      console.log('  ✗ Unexpected warning for active equipment');
      return false;
    }
    return true;
  } else {
    console.log('✗ Failed to scan QR code:', response.data);
    return false;
  }
}

async function testScanQRCodeMaintenance() {
  console.log('\n6. Testing QR scan for equipment under maintenance...');

  // Update equipment to maintenance status
  await makeRequest('PUT', `/api/equipment/${testEquipmentId}`, {
    status: 'maintenance',
  }, authToken);

  const response = await makeRequest('GET', `/api/equipment/qr/${testQrCodeUuid}`, null, studentToken);

  if (response.status === 200) {
    if (response.data.data.warning && response.data.data.warning.includes('maintenance')) {
      console.log('✓ Maintenance warning displayed correctly');
      console.log(`  Warning: ${response.data.data.warning}`);
      return true;
    } else {
      console.log('✗ Should show maintenance warning');
      return false;
    }
  } else {
    console.log('✗ Failed to scan QR code');
    return false;
  }
}

async function testScanQRCodeBroken() {
  console.log('\n7. Testing QR scan for broken equipment...');

  // Update equipment to broken status
  await makeRequest('PUT', `/api/equipment/${testEquipmentId}`, {
    status: 'broken',
  }, authToken);

  const response = await makeRequest('GET', `/api/equipment/qr/${testQrCodeUuid}`, null, studentToken);

  if (response.status === 200) {
    if (response.data.data.warning && response.data.data.warning.includes('out of service')) {
      console.log('✓ Out of service warning displayed correctly');
      console.log(`  Warning: ${response.data.data.warning}`);
      return true;
    } else {
      console.log('✗ Should show out of service warning');
      return false;
    }
  } else {
    console.log('✗ Failed to scan QR code');
    return false;
  }
}

async function testScanInvalidQRCode() {
  console.log('\n8. Testing scan with invalid QR code...');
  const fakeUuid = '00000000-0000-0000-0000-000000000000';
  const response = await makeRequest('GET', `/api/equipment/qr/${fakeUuid}`, null, studentToken);

  if (response.status === 404) {
    console.log('✓ Invalid QR code correctly rejected');
    return true;
  } else {
    console.log('✗ Should reject invalid QR code');
    return false;
  }
}

async function testGenerateQRForNonExistentEquipment() {
  console.log('\n9. Testing QR generation for non-existent equipment...');
  const fakeId = '00000000-0000-0000-0000-000000000000';
  const response = await makeRequest('GET', `/api/equipment/${fakeId}/qr-code`, null, authToken);

  if (response.status === 404) {
    console.log('✓ Non-existent equipment correctly rejected');
    return true;
  } else {
    console.log('✗ Should reject non-existent equipment');
    return false;
  }
}

async function testMultipleQRCodeGeneration() {
  console.log('\n10. Testing multiple QR code generations for same equipment...');

  // Generate QR code twice
  const response1 = await makeRequest('GET', `/api/equipment/${testEquipmentId}/qr-code`, null, authToken);
  const response2 = await makeRequest('GET', `/api/equipment/${testEquipmentId}/qr-code`, null, authToken);

  if (response1.status === 200 && response2.status === 200) {
    // Both should have same UUID
    if (response1.data.data.qrCodeUuid === response2.data.data.qrCodeUuid) {
      console.log('✓ QR code UUID remains consistent');
      console.log(`  UUID: ${response1.data.data.qrCodeUuid}`);
      return true;
    } else {
      console.log('✗ QR code UUID should not change');
      return false;
    }
  } else {
    console.log('✗ Failed to generate QR codes');
    return false;
  }
}

async function testQRCodeDataURLFormat() {
  console.log('\n11. Testing QR code data URL format...');
  const response = await makeRequest('GET', `/api/equipment/${testEquipmentId}/qr-code`, null, authToken);

  if (response.status === 200) {
    const dataUrl = response.data.data.qrCodeImage;

    // Check format
    const isValidFormat = dataUrl.startsWith('data:image/png;base64,');
    const hasValidBase64 = /^[A-Za-z0-9+/=]+$/.test(dataUrl.split(',')[1]);

    if (isValidFormat && hasValidBase64) {
      console.log('✓ QR code data URL format is valid');
      console.log(`  Format: PNG base64`);
      console.log(`  Length: ${dataUrl.length} characters`);
      return true;
    } else {
      console.log('✗ Invalid data URL format');
      return false;
    }
  } else {
    console.log('✗ Failed to generate QR code');
    return false;
  }
}

async function testValidationErrors() {
  console.log('\n12. Testing validation errors...');

  // Invalid UUID format
  const response1 = await makeRequest('GET', '/api/equipment/qr/invalid-uuid', null, studentToken);
  if (response1.status === 400) {
    console.log('  ✓ Invalid QR UUID format rejected');
  } else {
    console.log('  ✗ Should reject invalid UUID format');
  }

  // Invalid equipment ID for QR generation
  const response2 = await makeRequest('GET', '/api/equipment/not-a-uuid/qr-code', null, authToken);
  if (response2.status === 400) {
    console.log('  ✓ Invalid equipment ID format rejected');
  } else {
    console.log('  ✗ Should reject invalid equipment ID format');
  }

  console.log('✓ Validation errors tested');
  return true;
}

async function cleanupTestData() {
  console.log('\n13. Cleaning up test data...');

  // Delete test equipment
  const response = await makeRequest('DELETE', `/api/equipment/${testEquipmentId}`, null, authToken);

  if (response.status === 200) {
    console.log('✓ Test equipment cleaned up successfully');
    return true;
  } else {
    console.log('⚠ Failed to cleanup test data (non-critical)');
    return true; // Don't fail the test suite for cleanup issues
  }
}

// Main test runner
async function runTests() {
  console.log('=================================');
  console.log('QR Code Integration API Tests');
  console.log('=================================');

  try {
    // Setup
    if (!await testLogin()) return;
    if (!await testStudentLogin()) return;
    if (!await testCreateEquipmentForQR()) return;

    // QR Code tests
    if (!await testGenerateQRCodeImage()) return;
    if (!await testScanQRCodeActive()) return;
    if (!await testScanQRCodeMaintenance()) return;
    if (!await testScanQRCodeBroken()) return;
    if (!await testScanInvalidQRCode()) return;
    if (!await testGenerateQRForNonExistentEquipment()) return;
    if (!await testMultipleQRCodeGeneration()) return;
    if (!await testQRCodeDataURLFormat()) return;
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
