// Test script for mobile properties API
const fetch = require('node-fetch');

async function testMobilePropertiesAPI() {
  const baseUrl = 'http://localhost:3000';

  // You'll need to replace this with a valid access token and property ID
  const accessToken = 'your_access_token_here';
  const propertyId = 'your_property_id_here'; // Must be a valid UUID like: "123e4567-e89b-12d3-a456-426614174000"

  try {
    console.log('Testing mobile properties API...');

    const response = await fetch(
      `${baseUrl}/api/mobile/properties/${propertyId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ API call successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ API call failed!');
      console.log('Status:', response.status);
      console.log('Error:', data);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Helper function to get a property ID from the database
async function getPropertyId() {
  try {
    const response = await fetch('http://localhost:3000/api/properties', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.properties && data.properties.length > 0) {
        console.log('📋 Available property IDs:');
        data.properties.forEach((prop, index) => {
          console.log(
            `${index + 1}. ${prop.id} - ${prop.project_name || 'Unnamed'}`
          );
        });
        return data.properties[0].id; // Return first property ID
      }
    }
  } catch (error) {
    console.log('Could not fetch property list:', error.message);
  }
  return null;
}

// Instructions for running the test
console.log('📋 Instructions for testing:');
console.log('1. Start your Next.js development server: npm run dev');
console.log('2. Get a valid access token from your authentication flow');
console.log(
  '3. Run getPropertyId() to get a valid property ID from your database'
);
console.log('4. Replace the placeholder values in this script');
console.log('5. Run: node test-mobile-properties-api.js');
console.log('');
console.log('🔧 CORRECT API CALL FORMAT:');
console.log('URL: http://localhost:3000/api/mobile/properties/{PROPERTY_UUID}');
console.log('Headers: Authorization: Bearer {ACCESS_TOKEN}');
console.log(
  'Example: http://localhost:3000/api/mobile/properties/d1a651f9-389c-4ee5-aaa8-2ae797ef2512'
);
console.log('');

// Uncomment the lines below to run the test
// const propertyId = await getPropertyId();
// testMobilePropertiesAPI();
