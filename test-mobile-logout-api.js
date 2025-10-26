/**
 * Test script for Mobile Logout API
 *
 * This script tests the POST /api/auth/mobile/logout endpoint
 *
 * Usage:
 * 1. Make sure you have a valid access token (obtained from /api/auth/mobile/login)
 * 2. Update the ACCESS_TOKEN variable below with your token
 * 3. Run: node test-mobile-logout-api.js
 */

const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // Replace with actual token

const API_BASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000';

async function testLogout() {
  console.log('\n=== Testing POST /api/auth/mobile/logout ===\n');

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/mobile/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Successfully logged out!');
      console.log('📝 Note: You should delete the token from secure storage');
      if (data.user_id) {
        console.log(`   User ID: ${data.user_id}`);
      }
    } else {
      console.log('\n❌ Failed to logout');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function testWithoutToken() {
  console.log('\n=== Testing without Authorization (should fail) ===\n');

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/mobile/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log('\n✅ Correctly rejected request without token');
    } else {
      console.log('\n⚠️  Unexpected response');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function testWithInvalidToken() {
  console.log('\n=== Testing with invalid token (should fail) ===\n');

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/mobile/logout`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer invalid_token_12345',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log('\n✅ Correctly rejected invalid token');
    } else {
      console.log('\n⚠️  Unexpected response');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('🚪 Mobile Logout API Test Script\n');
  console.log('Testing endpoint: POST /api/auth/mobile/logout\n');
  console.log('='.repeat(50));

  // Test with valid authentication
  await testLogout();

  // Test without authentication
  await testWithoutToken();

  // Test with invalid token
  await testWithInvalidToken();

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Tests completed!\n');
  console.log(
    '📌 Remember: After logout, delete the token from secure storage'
  );
}

// Run the tests
if (ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
  console.log('⚠️  Please update ACCESS_TOKEN with a valid token first!');
  console.log('   Get a token by logging in: POST /api/auth/mobile/login');
} else {
  runTests();
}
