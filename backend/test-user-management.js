const http = require('http');

// Use existing test user token
let authToken = '';

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
            body: JSON.parse(body),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
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

async function testUserManagement() {
  console.log('\n🧪 Testing User Management Endpoints\n');
  console.log('='.repeat(60));

  try {
    // First, login to get token
    console.log('\n🔐 Logging in as GymOwner...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'owner@testgym.com',
      password: 'password123',
    });

    if (loginRes.status !== 200) {
      console.error('❌ Login failed!');
      return;
    }

    authToken = loginRes.body.data.token;
    const currentUserId = loginRes.body.data.user.id;
    console.log('✅ Logged in successfully');
    console.log(`   User ID: ${currentUserId}`);

    // Test 1: Get all users
    console.log('\n1️⃣  Testing GET /api/users (list all users)');
    console.log('-'.repeat(60));

    const usersRes = await makeRequest('GET', '/api/users?page=1&limit=10', null, authToken);
    console.log(`Status: ${usersRes.status}`);
    console.log(`Users found: ${usersRes.body.data?.length || 0}`);
    console.log(`Total: ${usersRes.body.pagination?.total || 0}`);

    if (usersRes.status === 200) {
      console.log('✅ User listing working!');
      usersRes.body.data.slice(0, 2).forEach((user) => {
        console.log(`   - ${user.firstName} ${user.lastName} (${user.role.name})`);
      });
    } else {
      console.log('❌ User listing failed!');
      console.log(JSON.stringify(usersRes.body, null, 2));
    }

    // Test 2: Get user by ID
    console.log('\n2️⃣  Testing GET /api/users/:id');
    console.log('-'.repeat(60));

    const userRes = await makeRequest('GET', `/api/users/${currentUserId}`, null, authToken);
    console.log(`Status: ${userRes.status}`);

    if (userRes.status === 200) {
      console.log('✅ Get user by ID working!');
      console.log(`   Name: ${userRes.body.data.firstName} ${userRes.body.data.lastName}`);
      console.log(`   Email: ${userRes.body.data.email}`);
      console.log(`   Role: ${userRes.body.data.role.name}`);
    } else {
      console.log('❌ Get user by ID failed!');
    }

    // Test 3: Update user profile
    console.log('\n3️⃣  Testing PUT /api/users/:id (update profile)');
    console.log('-'.repeat(60));

    const updateRes = await makeRequest(
      'PUT',
      `/api/users/${currentUserId}`,
      {
        phone: '+905551234567',
        gender: 'Male',
      },
      authToken
    );
    console.log(`Status: ${updateRes.status}`);

    if (updateRes.status === 200) {
      console.log('✅ Profile update working!');
      console.log(`   Updated phone: ${updateRes.body.data.phone}`);
      console.log(`   Updated gender: ${updateRes.body.data.gender}`);
    } else {
      console.log('❌ Profile update failed!');
      console.log(JSON.stringify(updateRes.body, null, 2));
    }

    // Test 4: Add measurement
    console.log('\n4️⃣  Testing POST /api/users/:id/measurements');
    console.log('-'.repeat(60));

    const measurementRes = await makeRequest(
      'POST',
      `/api/users/${currentUserId}/measurements`,
      {
        weight: 75.5,
        height: 180,
        bodyFatPercentage: 15.5,
        muscleMass: 35.2,
      },
      authToken
    );
    console.log(`Status: ${measurementRes.status}`);

    if (measurementRes.status === 201) {
      console.log('✅ Add measurement working!');
      console.log(`   Weight: ${measurementRes.body.data.weight} kg`);
      console.log(`   Height: ${measurementRes.body.data.height} cm`);
      console.log(`   Body Fat: ${measurementRes.body.data.bodyFatPercentage}%`);
      console.log(`   Muscle Mass: ${measurementRes.body.data.muscleMass} kg`);
    } else {
      console.log('❌ Add measurement failed!');
      console.log(JSON.stringify(measurementRes.body, null, 2));
    }

    // Test 5: Get measurements
    console.log('\n5️⃣  Testing GET /api/users/:id/measurements');
    console.log('-'.repeat(60));

    const measurementsRes = await makeRequest(
      'GET',
      `/api/users/${currentUserId}/measurements`,
      null,
      authToken
    );
    console.log(`Status: ${measurementsRes.status}`);

    if (measurementsRes.status === 200) {
      console.log('✅ Get measurements working!');
      console.log(`   Total measurements: ${measurementsRes.body.data.length}`);
      if (measurementsRes.body.data.length > 0) {
        const latest = measurementsRes.body.data[0];
        console.log(`   Latest: ${latest.weight}kg, ${latest.height}cm`);
      }
    } else {
      console.log('❌ Get measurements failed!');
    }

    // Test 6: Search users
    console.log('\n6️⃣  Testing GET /api/users?search=owner');
    console.log('-'.repeat(60));

    const searchRes = await makeRequest('GET', '/api/users?search=owner', null, authToken);
    console.log(`Status: ${searchRes.status}`);

    if (searchRes.status === 200) {
      console.log('✅ User search working!');
      console.log(`   Results: ${searchRes.body.data.length}`);
    } else {
      console.log('❌ User search failed!');
    }

    // Test 7: Filter by role
    console.log('\n7️⃣  Testing GET /api/users?role=Student');
    console.log('-'.repeat(60));

    const filterRes = await makeRequest('GET', '/api/users?role=Student', null, authToken);
    console.log(`Status: ${filterRes.status}`);

    if (filterRes.status === 200) {
      console.log('✅ Role filtering working!');
      console.log(`   Students found: ${filterRes.body.data.length}`);
    } else {
      console.log('❌ Role filtering failed!');
    }

    // Test 8: Change password
    console.log('\n8️⃣  Testing PUT /api/users/:id/password');
    console.log('-'.repeat(60));

    const passwordRes = await makeRequest(
      'PUT',
      `/api/users/${currentUserId}/password`,
      {
        currentPassword: 'password123',
        newPassword: 'password123', // Same password for testing
      },
      authToken
    );
    console.log(`Status: ${passwordRes.status}`);

    if (passwordRes.status === 200) {
      console.log('✅ Password change working!');
    } else {
      console.log('❌ Password change failed!');
      console.log(JSON.stringify(passwordRes.body, null, 2));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All user management tests completed!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

testUserManagement();
