const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMobileCityAPI() {
  console.log('🧪 Testing Mobile Cities API...\n');

  try {
    // Test: Get all cities
    console.log('1️⃣ Testing GET /api/mobile/cities');
    const citiesResponse = await axios.get(`${BASE_URL}/api/mobile/cities`);

    console.log('✅ Cities API Response:', {
      success: citiesResponse.data.success,
      total: citiesResponse.data.total,
      sampleCity: citiesResponse.data.cities[0],
    });

    if (citiesResponse.data.cities.length > 0) {
      console.log('\n📋 Sample cities:');
      citiesResponse.data.cities.slice(0, 5).forEach((city, index) => {
        console.log(
          `${index + 1}. ${city.name}, ${city.state.name}, ${city.state.country.name}`
        );
      });
    }

    console.log('\n🎉 Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testMobileCityAPI();
