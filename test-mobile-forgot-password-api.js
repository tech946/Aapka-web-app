/**
 * Test file for Mobile Forgot Password API
 *
 * This script tests the forgot password functionality for mobile apps
 */

const API_BASE_URL = 'http://localhost:3000/api';

// Test data
const testEmail = 'test@example.com'; // Replace with a valid email
const invalidEmail = 'notanemail';

/**
 * Test Forgot Password API
 */
async function testForgotPassword() {
  console.log('=== Testing Mobile Forgot Password API ===\n');

  // Test 1: Missing email
  console.log('Test 1: Missing email');
  try {
    const response = await fetch(`${API_BASE_URL}/mobile/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log();
  } catch (error) {
    console.error('Error:', error.message);
    console.log();
  }

  // Test 2: Invalid email format
  console.log('Test 2: Invalid email format');
  try {
    const response = await fetch(`${API_BASE_URL}/mobile/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: invalidEmail }),
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log();
  } catch (error) {
    console.error('Error:', error.message);
    console.log();
  }

  // Test 3: Valid email (will always return success for security)
  console.log('Test 3: Valid email - sending password reset email');
  try {
    const response = await fetch(`${API_BASE_URL}/mobile/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log();

    if (data.success) {
      console.log('✓ Password reset email sent successfully');
      console.log('✓ Please check the email inbox for the reset link');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n=== Forgot Password API Tests Complete ===');
  console.log('\nNext steps:');
  console.log('1. Check the email inbox for the password reset link');
  console.log('2. Click the link in the email');
  console.log(
    '3. The link will redirect to your app or the reset password page'
  );
  console.log('4. For mobile apps, you may need to configure deep linking');
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting Mobile Forgot Password API tests...\n');
  await testForgotPassword();
  console.log('\nAll tests completed!');
}

// Execute tests if run directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testForgotPassword };
