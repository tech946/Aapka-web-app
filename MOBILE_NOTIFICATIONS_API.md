# Mobile Notifications API Documentation

## Overview

This API provides endpoints for mobile applications to manage user notifications. Notifications are stored in the `notifications` table and are associated with a specific user via the `user_id` field.

## Endpoints

### GET `/api/mobile/notifications`

Retrieves notifications for the authenticated user based on their token's user_id.

### PUT `/api/mobile/notifications`

Marks notifications as read for the authenticated user.

---

## Authentication

**Required:** Bearer token authentication

**Header:**

```
Authorization: Bearer <access_token>
```

The access token can be obtained by logging in through `/api/auth/mobile/login`.

---

## GET - Get Notifications

### Request

**Method:** `GET`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Query Parameters:**

| Parameter     | Type    | Default | Description                                |
| ------------- | ------- | ------- | ------------------------------------------ |
| `page`        | integer | 1       | Page number (for pagination)               |
| `limit`       | integer | 10      | Number of notifications per page           |
| `unread_only` | boolean | false   | Filter to return only unread notifications |

**Body:** None

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "user_id": "uuid-of-authenticated-user",
  "notifications": [
    {
      "id": "notification-uuid",
      "user_id": "user-uuid",
      "lead_id": "lead-uuid",
      "type": "lead_status_change",
      "title": "Lead Status Updated",
      "message": "Your lead status has been changed to 'Interested'",
      "data": {
        "old_status": "new",
        "new_status": "interested"
      },
      "is_read": false,
      "created_at": "2024-01-01T12:00:00Z",
      "read_at": null
    }
  ],
  "unread_count": 5,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3,
    "has_more": true
  }
}
```

#### Empty Response (200 OK)

```json
{
  "success": true,
  "user_id": "uuid-of-authenticated-user",
  "notifications": [],
  "unread_count": 0,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "total_pages": 0,
    "has_more": false
  }
}
```

### Error Responses

#### 401 Unauthorized - Missing Token

```json
{
  "error": "Unauthorized. Please provide a valid access token."
}
```

#### 401 Unauthorized - Invalid Token

```json
{
  "error": "Invalid or expired access token. Please login again."
}
```

#### 404 Not Found - Profile not found

```json
{
  "error": "User profile not found. Please contact support."
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## PUT - Mark Notifications as Read

### Request

**Method:** `PUT`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body Options:**

**Option 1: Mark all notifications as read**

```json
{
  "mark_all_read": true
}
```

**Option 2: Mark specific notifications as read**

```json
{
  "notification_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "All notifications marked as read successfully"
}
```

Or for specific notifications:

```json
{
  "success": true,
  "message": "Notifications marked as read successfully",
  "notification_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

### Error Responses

#### 400 Bad Request - Invalid Parameters

```json
{
  "error": "Invalid request parameters"
}
```

---

## Usage Examples

### JavaScript/TypeScript

#### Fetch All Notifications

```javascript
async function getNotifications(accessToken, page = 1, limit = 10) {
  try {
    const response = await fetch(
      `https://your-domain.com/api/mobile/notifications?page=${page}&limit=${limit}`,
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
      console.log(`Total notifications: ${data.pagination.total}`);
      console.log(`Unread count: ${data.unread_count}`);
      return data.notifications;
    } else {
      console.error('Error:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
}
```

#### Fetch Only Unread Notifications

```javascript
async function getUnreadNotifications(accessToken) {
  const response = await fetch(
    'https://your-domain.com/api/mobile/notifications?unread_only=true',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  return data.notifications; // Returns only unread notifications
}
```

#### Mark All Notifications as Read

```javascript
async function markAllAsRead(accessToken) {
  const response = await fetch(
    'https://your-domain.com/api/mobile/notifications',
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mark_all_read: true,
      }),
    }
  );

  const data = await response.json();
  return data;
}
```

#### Mark Specific Notifications as Read

```javascript
async function markNotificationsRead(accessToken, notificationIds) {
  const response = await fetch(
    'https://your-domain.com/api/mobile/notifications',
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification_ids: notificationIds,
      }),
    }
  );

  const data = await response.json();
  return data;
}
```

### cURL

#### Fetch Notifications

```bash
curl -X GET "https://your-domain.com/api/mobile/notifications?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

#### Fetch Unread Only

```bash
curl -X GET "https://your-domain.com/api/mobile/notifications?unread_only=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

#### Mark All as Read

```bash
curl -X PUT https://your-domain.com/api/mobile/notifications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mark_all_read": true}'
```

#### Mark Specific as Read

```bash
curl -X PUT https://your-domain.com/api/mobile/notifications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notification_ids": ["uuid-1", "uuid-2"]}'
```

---

## Notification Structure

### Fields

| Field        | Type    | Description                                       |
| ------------ | ------- | ------------------------------------------------- |
| `id`         | UUID    | Unique notification ID                            |
| `user_id`    | UUID    | User ID this notification belongs to              |
| `lead_id`    | UUID    | Associated lead ID                                |
| `type`       | string  | Notification type (e.g., 'lead_status_change')    |
| `title`      | string  | Notification title                                |
| `message`    | string  | Notification message                              |
| `data`       | JSONB   | Additional metadata (old_status, new_status, etc) |
| `is_read`    | boolean | Whether the notification has been read            |
| `created_at` | string  | ISO 8601 timestamp when created                   |
| `read_at`    | string  | ISO 8601 timestamp when read (null if unread)     |

### Notification Types

- `lead_status_change` - Lead status has been updated
- `timeline_update` - Timeline has been updated
- (Other types as defined by the system)

---

## Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  lead_id UUID REFERENCES leads(id) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_lead_id ON notifications(lead_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

## Integration with Other APIs

### Related Endpoints

1. **Mobile Login:** `POST /api/auth/mobile/login`
   - Get the access token needed for authentication

2. **Mobile Leads:** `GET /api/mobile/leads`
   - View leads associated with notifications

3. **Mobile Profile:** `GET /api/mobile/user-details`
   - Get user information

---

## Testing

Use the provided test script to test the API:

```bash
node test-mobile-notifications-api.js
```

**Before running:**

1. Update `ACCESS_TOKEN` in the test file with a valid token
2. Get a token by logging in: `POST /api/auth/mobile/login`

---

## Security

- ✅ **Authentication Required:** Only authenticated users can access their notifications
- ✅ **User Isolation:** Users can only view their own notifications (based on user_id from token)
- ✅ **Bearer Token:** Uses JWT-based authentication
- ✅ **Row Level Security:** Database policies enforce user isolation

---

## Pagination

The API supports cursor-based pagination:

- `page`: Page number (starts at 1)
- `limit`: Number of items per page
- `has_more`: Boolean indicating if there are more pages
- `total`: Total number of notifications
- `total_pages`: Total number of pages

### Example Pagination Flow

```javascript
async function getAllNotifications(accessToken) {
  const allNotifications = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://your-domain.com/api/mobile/notifications?page=${page}&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    allNotifications.push(...data.notifications);
    hasMore = data.pagination.has_more;
    page++;
  }

  return allNotifications;
}
```

---

## Notes

- The `user_id` is automatically determined from the authenticated token
- Notifications are ordered by `created_at` descending (newest first)
- The `data` field contains additional JSON metadata specific to the notification type
- The `read_at` timestamp is set when a notification is marked as read
- Use the `unread_only` filter to get notifications that need attention

---

## Support

For issues or questions:

1. Check the error response for specific error messages
2. Verify your access token is valid and not expired
3. Ensure your user profile exists in the `profiles` table
4. Contact support if issues persist
