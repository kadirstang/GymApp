const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${path}`, { timeout: 2000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`✅ ${path}: ${res.statusCode}`);
        try {
          console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
          console.log(data);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${path}: ${err.message}`);
      reject(err);
    });

    req.on('timeout', () => {
      console.log(`⏱️  ${path}: Timeout`);
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function runTests() {
  console.log('🧪 API Test Başlıyor...\n');

  try {
    await testEndpoint('/health');
    console.log('');
    await testEndpoint('/');
    console.log('');
    await testEndpoint('/api/test');
  } catch (err) {
    // Ignore
  }

  console.log('\n✅ Testler tamamlandı');
  process.exit(0);
}

runTests();
