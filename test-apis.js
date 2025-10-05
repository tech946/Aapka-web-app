// Quick test script to verify APIs are working
// Run with: node test-apis.js

const baseUrl = 'http://localhost:3000';

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const result = await response.json();

    console.log(`✅ ${method} ${endpoint}:`, response.status);
    if (response.status !== 200) {
      console.log('   Error:', result.error);
    }
    return result;
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}:`, error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing API endpoints...\n');

  // Test GET endpoints
  await testAPI('/api/countries');
  await testAPI('/api/states');
  await testAPI('/api/cities');
  await testAPI('/api/areas');
  await testAPI('/api/property-types');

  // Test POST endpoints (create test data)
  console.log('\n📝 Testing POST endpoints...');

  await testAPI('/api/countries', 'POST', { name: 'Test Country' });
  await testAPI('/api/property-types', 'POST', {
    name: 'Test Property Type',
    description: 'Test Description',
  });

  console.log('\n🎉 API tests completed!');
}

runTests();
