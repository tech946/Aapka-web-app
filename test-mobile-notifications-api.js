/**
 * Test script for Mobile Notifications API
 *
 * This script tests the GET and PUT /api/mobile/notifications endpoints
 *
 * Usage:
 * 1. Make sure you have a valid access token (obtained from /api/auth/mobile/login)
 * 2. Update the ACCESS_TOKEN variable below with your token
 * 3. Run: node test-mobile-notifications-api.js
 */

const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // Replace with actual token

const API_BASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000';

async function testGetNotifications() {
  console.log('\n=== Testing GET /api/mobile/notifications ===\n');

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/mobile/notifications?page=1&limit=10`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Successfully fetched notifications!');
      console.log(`  - Total notifications: ${data.pagination.total}`);
      console.log(`  - Unread count: ${data.unread_count}`);
      console.log(`  - Current page: ${data.pagination.page}`);
      console.log(`  - Total pages: ${data.pagination.total_pages}`);

      if (data.notifications && data.notifications.length > 0) {
        console.log('\n📬 Sample notification:');
        console.log(`  - Title: ${data.notifications[0].title}`);
        console.log(`  - Message: ${data.notifications[0].message}`);
        console.log(`  - Type: ${data.notifications[0].type}`);
        console.log(`  - Is Read: ${data.notifications[0].is_read}`);
        console.log(`  - Created At: ${data.notifications[0].created_at}`);
      } else {
        console.log('\n⚠️  No notifications found');
      }
    } else {
      console.log('\n❌ Failed to fetch notifications');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function testGetUnreadNotifications() {
  console.log(
    '\n=== Testing GET /api/mobile/notifications (unread only) ===\n'
  );

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/mobile/notifications?unread_only=true`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    console.log('Status:', response.status);

    if (response.ok) {
      console.log('✅ Successfully fetched unread notifications!');
      console.log(`  - Unread notifications: ${data.notifications.length}`);
    } else {
      console.log('❌ Failed to fetch unread notifications');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testMarkNotificationsRead() {
  console.log(
    '\n=== Testing PUT /api/mobile/notifications (mark all as read) ===\n'
  );

  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/notifications`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mark_all_read: true,
      }),
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Successfully marked all notifications as read!');
    } else {
      console.log('\n❌ Failed to mark notifications as read');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function testMarkSpecificNotificationRead() {
  console.log(
    '\n=== Testing PUT /api/mobile/notifications (mark specific as read) ===\n'
  );

  try {
    // First, get some notifications to mark
    const getResponse = await fetch(
      `${API_BASE_URL}/api/mobile/notifications?limit=5`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const getData = await getResponse.json();

    if (!getData.notifications || getData.notifications.length === 0) {
      console.log('⚠️  No notifications to mark as read');
      return;
    }

    // Get first unread notification ID
    const unreadNotification = getData.notifications.find(n => !n.is_read);

    if (!unreadNotification) {
      console.log('⚠️  No unread notifications to mark');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/mobile/notifications`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification_ids: [unreadNotification.id],
      }),
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Successfully marked notification as read!');
    } else {
      console.log('\n❌ Failed to mark notification as read');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function testWithoutAuth() {
  console.log('\n=== Testing without Authorization (should fail) ===\n');

  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/notifications`, {
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
  console.log('📬 Mobile Notifications API Test Script\n');
  console.log('Testing endpoints: GET/PUT /api/mobile/notifications\n');
  console.log('='.repeat(50));

  // Test with valid authentication
  await testGetNotifications();
  await testGetUnreadNotifications();
  await testMarkNotificationsRead();
  await testMarkSpecificNotificationRead();

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
