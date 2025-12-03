const http = require('http');

// Test data from database
const GYM_ID = '6a589125-8659-4912-97b8-8f58962501ed';
const STUDENT_ROLE_ID = '12764672-8b2a-40e9-acc9-3e5e5bad5d67';

// Store token for authenticated requests
let authToken = '';
let refreshToken = '';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
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
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
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

async function testAuthEndpoints() {
  console.log('\n🧪 Testing Authentication Endpoints\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Register new user
    console.log('\n1️⃣  Testing POST /api/auth/register');
    console.log('-'.repeat(60));

    const registerData = {
      email: `test.user.${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+905551234567',
      gymId: GYM_ID,
      roleId: STUDENT_ROLE_ID,
    };

    console.log('Request body:', JSON.stringify(registerData, null, 2));
    const registerRes = await makeRequest('POST', '/api/auth/register', registerData);
    console.log(`Status: ${registerRes.status}`);
    console.log('Response:', JSON.stringify(registerRes.body, null, 2));

    if (registerRes.status === 201) {
      authToken = registerRes.body.data.token;
      refreshToken = registerRes.body.data.refreshToken;
      console.log('✅ Registration successful!');
      console.log(`🔑 Token saved: ${authToken.substring(0, 20)}...`);
    } else {
      console.log('❌ Registration failed!');
    }

    // Test 2: Register with existing email (should fail)
    console.log('\n2️⃣  Testing POST /api/auth/register (duplicate email)');
    console.log('-'.repeat(60));

    const duplicateRes = await makeRequest('POST', '/api/auth/register', registerData);
    console.log(`Status: ${duplicateRes.status}`);
    console.log('Response:', JSON.stringify(duplicateRes.body, null, 2));

    if (duplicateRes.status === 409) {
      console.log('✅ Duplicate email validation working!');
    } else {
      console.log('❌ Should have rejected duplicate email');
    }

    // Test 3: Login
    console.log('\n3️⃣  Testing POST /api/auth/login');
    console.log('-'.repeat(60));

    const loginData = {
      email: registerData.email,
      password: registerData.password,
    };

    console.log('Request body:', JSON.stringify(loginData, null, 2));
    const loginRes = await makeRequest('POST', '/api/auth/login', loginData);
    console.log(`Status: ${loginRes.status}`);
    console.log('Response:', JSON.stringify(loginRes.body, null, 2));

    if (loginRes.status === 200) {
      authToken = loginRes.body.data.token;
      console.log('✅ Login successful!');
      console.log(`🔑 New token: ${authToken.substring(0, 20)}...`);
    } else {
      console.log('❌ Login failed!');
    }

    // Test 4: Login with wrong password (should fail)
    console.log('\n4️⃣  Testing POST /api/auth/login (wrong password)');
    console.log('-'.repeat(60));

    const wrongPasswordRes = await makeRequest('POST', '/api/auth/login', {
      email: registerData.email,
      password: 'wrongpassword',
    });
    console.log(`Status: ${wrongPasswordRes.status}`);
    console.log('Response:', JSON.stringify(wrongPasswordRes.body, null, 2));

    if (wrongPasswordRes.status === 401) {
      console.log('✅ Wrong password validation working!');
    } else {
      console.log('❌ Should have rejected wrong password');
    }

    // Test 5: Get current user (protected route)
    console.log('\n5️⃣  Testing GET /api/auth/me (authenticated)');
    console.log('-'.repeat(60));

    const meRes = await makeRequest('GET', '/api/auth/me', null, authToken);
    console.log(`Status: ${meRes.status}`);
    console.log('Response:', JSON.stringify(meRes.body, null, 2));

    if (meRes.status === 200) {
      console.log('✅ Protected route working!');
    } else {
      console.log('❌ Protected route failed!');
    }

    // Test 6: Get current user without token (should fail)
    console.log('\n6️⃣  Testing GET /api/auth/me (no token)');
    console.log('-'.repeat(60));

    const noTokenRes = await makeRequest('GET', '/api/auth/me');
    console.log(`Status: ${noTokenRes.status}`);
    console.log('Response:', JSON.stringify(noTokenRes.body, null, 2));

    if (noTokenRes.status === 401) {
      console.log('✅ Auth middleware working!');
    } else {
      console.log('❌ Should have rejected request without token');
    }

    // Test 7: Refresh token
    console.log('\n7️⃣  Testing POST /api/auth/refresh');
    console.log('-'.repeat(60));

    const refreshRes = await makeRequest(
      'POST',
      '/api/auth/refresh',
      { refreshToken },
      authToken
    );
    console.log(`Status: ${refreshRes.status}`);
    console.log('Response:', JSON.stringify(refreshRes.body, null, 2));

    if (refreshRes.status === 200) {
      console.log('✅ Token refresh working!');
    } else {
      console.log('❌ Token refresh failed!');
    }

    // Test 8: Invalid validation (missing required fields)
    console.log('\n8️⃣  Testing POST /api/auth/register (validation error)');
    console.log('-'.repeat(60));

    const invalidRes = await makeRequest('POST', '/api/auth/register', {
      email: 'invalidemail',
      password: '123', // Too short
    });
    console.log(`Status: ${invalidRes.status}`);
    console.log('Response:', JSON.stringify(invalidRes.body, null, 2));

    if (invalidRes.status === 400) {
      console.log('✅ Validation working!');
    } else {
      console.log('❌ Should have rejected invalid data');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All auth endpoint tests completed!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

testAuthEndpoints();
