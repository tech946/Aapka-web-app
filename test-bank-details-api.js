const fetch = require('node-fetch');

// Test the bank details API
async function testBankDetailsAPI() {
  const baseUrl = 'https://www.proptz.com';

  // Test data
  const testData = {
    bank_name: 'State Bank of India',
    account_number: '1234567890123456',
    confirm_account_number: '1234567890123456',
    ifsc_code: 'SBIN0001234',
  };

  // You'll need to replace this with a valid access token
  const accessToken = 'YOUR_ACCESS_TOKEN_HERE';

  console.log('Testing Bank Details API...');
  console.log('Base URL:', baseUrl);
  console.log('Test Data:', testData);

  try {
    // Test PUT request (update bank details)
    console.log('\n--- Testing PUT /api/mobile/update-bank-details ---');
    const putResponse = await fetch(
      `${baseUrl}/api/mobile/update-bank-details`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      }
    );

    const putResult = await putResponse.text();
    console.log('PUT Status:', putResponse.status);
    console.log('PUT Response:', putResult);

    // Test GET request (get bank details)
    console.log('\n--- Testing GET /api/mobile/update-bank-details ---');
    const getResponse = await fetch(
      `${baseUrl}/api/mobile/update-bank-details`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const getResult = await getResponse.text();
    console.log('GET Status:', getResponse.status);
    console.log('GET Response:', getResult);
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testBankDetailsAPI();
