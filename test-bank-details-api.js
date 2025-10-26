/**
 * Test script for Bank Details API
 *
 * This script tests the GET /api/mobile/bank-details endpoint
 * which fetches bank details from the profiles table account_details column
 *
 * Usage:
 * 1. Make sure you have a valid access token (obtained from /api/auth/mobile/login)
 * 2. Update the ACCESS_TOKEN variable below with your token
 * 3. Run: node test-bank-details-api.js
 */

const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // Replace with actual token

const API_BASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000';

async function testGetBankDetails() {
  console.log('\n=== Testing GET /api/mobile/bank-details ===\n');

  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/bank-details`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Successfully fetched bank details!');

      if (data.bank_details && Object.keys(data.bank_details).length > 0) {
        console.log('\n📊 Bank Details:');
        console.log(`  - Bank Name: ${data.bank_details.bank_name || 'N/A'}`);
        console.log(
          `  - Account Number: ${data.bank_details.account_number || 'N/A'}`
        );
        console.log(`  - IFSC Code: ${data.bank_details.ifsc_code || 'N/A'}`);
        console.log(`  - Updated At: ${data.bank_details.updated_at || 'N/A'}`);
      } else {
        console.log(
          '\n⚠️  No bank details found. Use PUT /api/mobile/update-bank-details to add them.'
        );
      }
    } else {
      console.log('\n❌ Failed to fetch bank details');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function testWithoutAuth() {
  console.log('\n=== Testing without Authorization (should fail) ===\n');

  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/bank-details`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log('\n✅ Correctly rejected unauthorized request');
    } else {
      console.log('\n⚠️  Unexpected response');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('🏦 Bank Details API Test Script\n');
  console.log('Testing endpoint: GET /api/mobile/bank-details\n');
  console.log('='.repeat(50));

  // Test with valid authentication
  await testGetBankDetails();

  // Test without authentication
  await testWithoutAuth();

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Tests completed!\n');
}

// Run the tests
if (ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
  console.log('⚠️  Please update ACCESS_TOKEN with a valid token first!');
  console.log('   Get a token by logging in: POST /api/auth/mobile/login');
} else {
  runTests();
}
