const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testDefaultSearchAPIs() {
  console.log('🧪 Testing Default Search APIs (Fixed Version)...\n');

  try {
    // Test 1: Get default search properties
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
          priceType: typeof searchResponse.data.data[0].starting_price,
        });
      }
    } catch (error) {
      console.log(
        '❌ Properties search failed:',
        error.response?.data || error.message
      );
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Test POST to add properties (should work now with proper auth)
    console.log('3️⃣ Testing POST /api/default-search-properties');
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
      console.log('❌ POST request failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run the tests
testDefaultSearchAPIs();
