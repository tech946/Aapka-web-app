# Mobile Delete Account API Documentation

## Overview

This API endpoint allows mobile applications to permanently delete a user's account. The deletion process removes all user data including profile information, authentication credentials, and associated files.

## Endpoint

### DELETE `/api/mobile/delete-account`

Permanently deletes the authenticated user's account and all associated data.

---

## Authentication

**Required:** Bearer token authentication

**Header:**

```
Authorization: Bearer <access_token>
```

The access token can be obtained by logging in through `/api/auth/mobile/login`.

---

## Request

**Method:** `DELETE`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body:** None

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Account deleted successfully",
  "user_id": "uuid-of-deleted-user"
}
```

### Error Responses

#### 401 Unauthorized - Missing Token

```json
{
  "error": "Unauthorized. Please provide a valid access token.",
  "success": false
}
```

#### 401 Unauthorized - Invalid Token

```json
{
  "error": "Invalid or expired access token. Please login again.",
  "success": false
}
```

#### 500 Internal Server Error - Profile Deletion Failed

```json
{
  "error": "Failed to delete profile",
  "details": "Error details...",
  "success": false
}
```

#### 500 Internal Server Error - Account Deletion Failed

```json
{
  "error": "Failed to delete account",
  "details": "Error details...",
  "success": false
}
```

#### 500 Internal Server Error - General Error

```json
{
  "error": "Internal server error",
  "details": "Error details...",
  "success": false
}
```

---

## What Gets Deleted

When a user's account is deleted, the following data is removed:

1. **Profile Image**: User's profile image is deleted from Supabase Storage
2. **Profile Data**: All profile information in the `profiles` table
3. **Auth Account**: User's authentication account in `auth.users` table

---

## Security Considerations

1. **Irreversible Action**: Account deletion is permanent and cannot be undone
2. **Token Verification**: The API verifies the access token before allowing deletion
3. **Self-Only Deletion**: Users can only delete their own accounts
4. **Files Cleanup**: Associated files (profile images) are automatically removed

---

## Usage Examples

### JavaScript/TypeScript (React Native)

```javascript
async function deleteAccount(accessToken) {
  try {
    // Show confirmation dialog first
    const confirmed = await showConfirmationDialog(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    // Call delete account endpoint
    const response = await fetch(
      'https://your-domain.com/api/mobile/delete-account',
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      // Delete token from secure storage
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');

      // Show success message
      Alert.alert('Success', 'Your account has been deleted successfully');

      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else {
      // Handle error
      Alert.alert('Error', data.error || 'Failed to delete account');
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    Alert.alert('Error', 'An unexpected error occurred');
  }
}
```

### Using Axios

```javascript
import axios from 'axios';

async function deleteAccount(accessToken) {
  try {
    const response = await axios.delete(
      'https://your-domain.com/api/mobile/delete-account',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.data.success) {
      // Delete token from secure storage
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');

      // Navigate to login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  } catch (error) {
    console.error('Error deleting account:', error.response?.data || error);
    throw error;
  }
}
```

---

## Testing with cURL

```bash
# Delete account
curl -X DELETE "https://your-domain.com/api/mobile/delete-account" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Error Handling

### Client-Side Error Handling

```javascript
try {
  const response = await fetch(
    'https://your-domain.com/api/mobile/delete-account',
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    switch (response.status) {
      case 401:
        console.error('Unauthorized - invalid or expired token');
        // Redirect to login
        break;
      case 500:
        console.error('Server error:', data.details);
        // Show error message to user
        break;
      default:
        console.error('Error:', data.error);
    }
  }
} catch (error) {
  console.error('Network error:', error);
  // Handle network errors
}
```

---

## Important Notes

1. **Permanent Deletion**: Account deletion is irreversible. Consider adding a confirmation dialog in your mobile app.

2. **Deletion Order**: The API deletes data in the following order:
   - Profile image from storage
   - Profile record from `profiles` table
   - Auth user from `auth.users` table

   This order ensures referential integrity and prevents orphaned records.

3. **Data Backup**: If your app needs to retain certain data for legal or business reasons, consider implementing a soft delete or data archiving mechanism before permanently deleting accounts.

4. **Related Data**: If your application has foreign key constraints or cascade rules in the database, related data may also be affected. Review your database schema to understand the full impact of account deletion.

5. **Storage Cleanup**: Profile images are automatically deleted, but if you have other stored files associated with the user (documents, property images, etc.), you may need to handle their cleanup separately.

6. **Token Invalidation**: After account deletion, the access token becomes invalid. Make sure to remove it from secure storage on the client side.

7. **Analytics**: Consider logging account deletions for analytics and compliance purposes.

---

## API Flow

```
1. Client sends DELETE request with Bearer token
   ↓
2. Server verifies token and extracts user ID
   ↓
3. Server fetches user's profile image URL
   ↓
4. Server deletes profile image from storage (if exists)
   ↓
5. Server deletes user's profile from profiles table
   ↓
6. Server deletes user's auth account from auth.users
   ↓
7. Server returns success response
   ↓
8. Client removes token from storage and redirects to login
```

---

## Related Endpoints

- `POST /api/auth/mobile/login` - Login to obtain access token
- `POST /api/auth/mobile/logout` - Logout user
- `GET /api/mobile/update-profile` - Get profile information
- `PUT /api/mobile/update-profile` - Update profile information
