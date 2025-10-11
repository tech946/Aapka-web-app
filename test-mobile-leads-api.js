/**
 * Test script for Mobile Leads API endpoints
 *
 * This script demonstrates how to:
 * 1. Login and get an access token
 * 2. Add a new lead
 * 3. Get leads for the authenticated user
 * 4. Search and filter leads
 *
 * Usage:
 *   node test-mobile-leads-api.js
 *
 * Make sure to update the credentials and base URL as needed
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials - UPDATE THESE WITH VALID CREDENTIALS
const TEST_USER = {
  email: 'user@example.com',
  password: 'password123',
};

let accessToken = '';

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n📡 ${options.method || 'GET'} ${endpoint}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 1: Login
async function testLogin() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Mobile Login');
  console.log('='.repeat(60));

  const result = await apiCall('/api/auth/mobile/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password,
    }),
  });

  if (result.success && result.data.access_token) {
    accessToken = result.data.access_token;
    console.log('✅ Login successful!');
    console.log(`🔑 Access token: ${accessToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Login failed!');
    return false;
  }
}

// Test 2: Add a lead
async function testAddLead() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Add Lead');
  console.log('='.repeat(60));

  const leadData = {
    fullname: 'John Doe',
    mobile_no: '+1234567890',
    email: 'john.doe@example.com',
    relationship: 'Friend',
    budget: 500000,
    purpose_of_buying: 'Investment',
    buying_timeline: '3-6 months',
    notes: 'Interested in waterfront properties',
  };

  console.log('Lead data:', JSON.stringify(leadData, null, 2));

  const result = await apiCall('/api/mobile/leads/add', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(leadData),
  });

  if (result.success) {
    console.log('✅ Lead added successfully!');
    return result.data.lead;
  } else {
    console.log('❌ Failed to add lead');
    return null;
  }
}

// Test 3: Get all leads
async function testGetLeads() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Get All Leads (Page 1)');
  console.log('='.repeat(60));

  const result = await apiCall('/api/mobile/leads?page=1&limit=10', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (result.success) {
    console.log(`✅ Retrieved ${result.data.leads.length} leads`);
    console.log(`Total leads: ${result.data.pagination.total}`);
    return result.data.leads;
  } else {
    console.log('❌ Failed to get leads');
    return [];
  }
}

// Test 4: Search leads
async function testSearchLeads() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Search Leads');
  console.log('='.repeat(60));

  const searchTerm = 'john';
  console.log(`Searching for: "${searchTerm}"`);

  const result = await apiCall(`/api/mobile/leads?search=${searchTerm}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (result.success) {
    console.log(`✅ Found ${result.data.leads.length} matching leads`);
    return result.data.leads;
  } else {
    console.log('❌ Search failed');
    return [];
  }
}

// Test 5: Filter by status
async function testFilterByStatus() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Filter Leads by Status');
  console.log('='.repeat(60));

  const status = 'new';
  console.log(`Filtering by status: "${status}"`);

  const result = await apiCall(`/api/mobile/leads?status=${status}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (result.success) {
    console.log(
      `✅ Found ${result.data.leads.length} leads with status "${status}"`
    );
    return result.data.leads;
  } else {
    console.log('❌ Filter failed');
    return [];
  }
}

// Test 6: Test without auth (should fail)
async function testUnauthorizedAccess() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 6: Unauthorized Access (Should Fail)');
  console.log('='.repeat(60));

  const result = await apiCall('/api/mobile/leads', {
    method: 'GET',
    // No Authorization header
  });

  if (result.status === 401) {
    console.log('✅ Correctly rejected unauthorized request');
  } else {
    console.log('❌ Should have rejected unauthorized request');
  }
}

// Test 7: Test with invalid token (should fail)
async function testInvalidToken() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 7: Invalid Token (Should Fail)');
  console.log('='.repeat(60));

  const result = await apiCall('/api/mobile/leads', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer invalid_token_12345',
    },
  });

  if (result.status === 401) {
    console.log('✅ Correctly rejected invalid token');
  } else {
    console.log('❌ Should have rejected invalid token');
  }
}

// Test 8: Test missing required fields (should fail)
async function testMissingFields() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 8: Missing Required Fields (Should Fail)');
  console.log('='.repeat(60));

  const incompleteData = {
    fullname: 'Jane Smith',
    mobile_no: '+9876543210',
    // Missing email and other required fields
  };

  const result = await apiCall('/api/mobile/leads/add', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(incompleteData),
  });

  if (result.status === 400) {
    console.log('✅ Correctly rejected incomplete data');
  } else {
    console.log('❌ Should have rejected incomplete data');
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          MOBILE LEADS API - INTEGRATION TESTS             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Test 1: Login (required for other tests)
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ Login failed. Cannot proceed with other tests.');
      console.log('Please update TEST_USER credentials in the script.\n');
      return;
    }

    // Test 2-5: Authenticated operations
    await testAddLead();
    await testGetLeads();
    await testSearchLeads();
    await testFilterByStatus();

    // Test 6-8: Error cases
    await testUnauthorizedAccess();
    await testInvalidToken();
    await testMissingFields();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  }
}

// Run the tests
runAllTests();
