const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMobileSearchAPI() {
  console.log('🧪 Testing Mobile Search Properties API...\n');

  try {
    // Test 1: Search with searchkey and pagination
    console.log(
      '1️⃣ Testing POST /api/mobile/search-properties with searchkey and pagination'
    );
    try {
      const searchResponse = await axios.post(
        `${BASE_URL}/api/mobile/search-properties`,
        {
          searchkey: 'apartment',
          areaname: 'Dubai',
          hasBrochure: true,
          page: 1,
          limit: 10,
        }
      );
      console.log('✅ Search with filters and pagination successful');
      console.log('Found properties:', searchResponse.data.data?.length || 0);
      console.log('Pagination info:', searchResponse.data.pagination);
      if (searchResponse.data.data?.length > 0) {
        console.log('Sample property:', {
          id: searchResponse.data.data[0].id,
          name: searchResponse.data.data[0].project_name,
          price: searchResponse.data.data[0].starting_price,
          hasBrochure: !!searchResponse.data.data[0].brochure_url,
        });
      }
    } catch (error) {
      console.log('❌ Search with filters failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Search without searchkey (should return default search properties)
    console.log(
      '2️⃣ Testing POST /api/mobile/search-properties without searchkey (default search)'
    );
    try {
      const defaultResponse = await axios.post(
        `${BASE_URL}/api/mobile/search-properties`,
        {}
      );
      console.log('✅ Default search successful');
      console.log(
        'Found default properties:',
        defaultResponse.data.data?.length || 0
      );
      if (defaultResponse.data.data?.length > 0) {
        console.log('Sample default property:', {
          id: defaultResponse.data.data[0].id,
          name: defaultResponse.data.data[0].project_name,
          price: defaultResponse.data.data[0].starting_price,
        });
      }
    } catch (error) {
      console.log('❌ Default search failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Search with empty searchkey (should return default search properties)
    console.log(
      '3️⃣ Testing POST /api/mobile/search-properties with empty searchkey'
    );
    try {
      const emptyResponse = await axios.post(
        `${BASE_URL}/api/mobile/search-properties`,
        {
          searchkey: '',
          areaname: 'Dubai',
        }
      );
      console.log('✅ Empty searchkey test successful');
      console.log('Found properties:', emptyResponse.data.data?.length || 0);
    } catch (error) {
      console.log('❌ Empty searchkey test failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Search with multiple filters
    console.log(
      '4️⃣ Testing POST /api/mobile/search-properties with multiple filters'
    );
    try {
      const multiFilterResponse = await axios.post(
        `${BASE_URL}/api/mobile/search-properties`,
        {
          searchkey: 'villa',
          cityname: 'Dubai',
          property_status: 'Ready',
          developers: ['Emaar', 'Nakheel'],
          hasBrochure: false,
        }
      );
      console.log('✅ Multi-filter search successful');
      console.log(
        'Found properties:',
        multiFilterResponse.data.data?.length || 0
      );
    } catch (error) {
      console.log('❌ Multi-filter search failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Test pagination specifically
    console.log('5️⃣ Testing pagination with different page sizes');
    try {
      const page1Response = await axios.post(
        `${BASE_URL}/api/mobile/search-properties`,
        {
          searchkey: 'apartment',
          page: 1,
          limit: 5,
        }
      );
      console.log('✅ Page 1 (limit 5) successful');
      console.log('Found properties:', page1Response.data.data?.length || 0);
      console.log('Pagination:', page1Response.data.pagination);

      if (page1Response.data.pagination?.hasNextPage) {
        const page2Response = await axios.post(
          `${BASE_URL}/api/mobile/search-properties`,
          {
            searchkey: 'apartment',
            page: 2,
            limit: 5,
          }
        );
        console.log('✅ Page 2 (limit 5) successful');
        console.log('Found properties:', page2Response.data.data?.length || 0);
        console.log('Pagination:', page2Response.data.pagination);
      }
    } catch (error) {
      console.log('❌ Pagination test failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 6: Test GET method (for testing purposes)
    console.log('6️⃣ Testing GET /api/mobile/search-properties');
    try {
      const getResponse = await axios.get(
        `${BASE_URL}/api/mobile/search-properties?searchkey=apartment&hasBrochure=true&page=1&limit=10`
      );
      console.log('✅ GET method successful');
      console.log('Found properties:', getResponse.data.data?.length || 0);
      console.log('Pagination:', getResponse.data.pagination);
    } catch (error) {
      console.log('❌ GET method failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run the tests
testMobileSearchAPI();
