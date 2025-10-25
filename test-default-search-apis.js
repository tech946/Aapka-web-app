const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testDefaultSearchAPIs() {
  console.log('🧪 Testing Default Search APIs...\n');

  try {
    // Test 1: Get default search properties (should work without auth for now)
    console.log('1️⃣ Testing GET /api/default-search-properties');
    try {
      const getResponse = await axios.get(
        `${BASE_URL}/api/default-search-properties`
      );
      console.log('✅ GET request successful');
      console.log('Response:', JSON.stringify(getResponse.data, null, 2));
    } catch (error) {
      console.log(
        '❌ GET request failed:',
        error.response?.data || error.message
      );
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Test properties search API
    console.log('2️⃣ Testing GET /api/properties with search');
    try {
      const searchResponse = await axios.get(
        `${BASE_URL}/api/properties?search=apartment&limit=5`
      );
      console.log('✅ Properties search successful');
      console.log('Found properties:', searchResponse.data.data?.length || 0);
      if (searchResponse.data.data?.length > 0) {
        console.log('Sample property:', {
          id: searchResponse.data.data[0].id,
          name: searchResponse.data.data[0].project_name,
          price: searchResponse.data.data[0].starting_price,
        });
      }
    } catch (error) {
      console.log(
        '❌ Properties search failed:',
        error.response?.data || error.message
      );
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Test POST to add properties (this will fail without auth, but we can see the structure)
    console.log(
      '3️⃣ Testing POST /api/default-search-properties (will fail without auth)'
    );
    try {
      const postResponse = await axios.post(
        `${BASE_URL}/api/default-search-properties`,
        {
          property_ids: ['test-id-1', 'test-id-2'],
          display_orders: [0, 1],
        }
      );
      console.log('✅ POST request successful');
      console.log('Response:', JSON.stringify(postResponse.data, null, 2));
    } catch (error) {
      console.log(
        '❌ POST request failed (expected without auth):',
        error.response?.data?.error || error.message
      );
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Test DELETE (will also fail without auth)
    console.log(
      '4️⃣ Testing DELETE /api/default-search-properties (will fail without auth)'
    );
    try {
      const deleteResponse = await axios.delete(
        `${BASE_URL}/api/default-search-properties?property_ids=test-id-1,test-id-2`
      );
      console.log('✅ DELETE request successful');
      console.log('Response:', JSON.stringify(deleteResponse.data, null, 2));
    } catch (error) {
      console.log(
        '❌ DELETE request failed (expected without auth):',
        error.response?.data?.error || error.message
      );
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run the tests
testDefaultSearchAPIs();
