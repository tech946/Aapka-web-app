# Mobile Profile & Password Update API

## Overview

The mobile profile update API allows users to update their profile information (stored in `profiles` table) and password (stored in `auth.users` table managed by Supabase Auth).

## Database Architecture

### Two-Table System

Your application uses a two-table system:

1. **`auth.users`** (Supabase Auth Table)
   - Managed by Supabase Auth
   - Stores: email, password hash, authentication tokens
   - Cannot be directly modified via SQL
   - Use Supabase Auth API to update passwords

2. **`profiles`** (Custom Table)
   - Your custom user profile table
   - Stores: full_name, profile_image_url, account_details, etc.
   - Can be updated directly via SQL
   - References `auth.users` via `id` (FK)

### Why Password Updates Work This Way

- **Passwords are in `auth.users`**: Managed by Supabase Auth for security
- **Profile data is in `profiles`**: Your custom fields
- **API updates both**: First verifies old password with Auth, then updates both tables

---

## Endpoint

### PUT `/api/mobile/update-profile`

Updates user profile and/or password.

**Required headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Request

### Update Profile Only

```json
{
  "full_name": "John Doe",
  "profile_image_url": "https://example.com/image.jpg"
}
```

### Update Password Only

```json
{
  "password": "NewSecurePassword123",
  "old_password": "CurrentPassword"
}
```

### Update Both Profile and Password

```json
{
  "full_name": "John Doe",
  "password": "NewSecurePassword123",
  "old_password": "CurrentPassword"
}
```

---

## Response

### Success Response (200 OK)

#### Profile Updated

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "password_updated": false,
  "id": "user-uuid",
  "full_name": "John Doe",
  "email_address": "john@example.com",
  "profile_image_url": "https://example.com/image.jpg",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

#### Password Updated

```json
{
  "success": true,
  "message": "Password updated successfully",
  "password_updated": true,
  "id": "user-uuid",
  "full_name": "John Doe",
  "email_address": "john@example.com",
  "profile_image_url": "https://example.com/image.jpg",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

#### Both Updated

```json
{
  "success": true,
  "message": "Profile and password updated successfully",
  "password_updated": true,
  "id": "user-uuid",
  "full_name": "Jane Smith",
  "email_address": "john@example.com",
  "profile_image_url": "https://example.com/image.jpg",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

---

## Error Responses

### 400 Bad Request - Missing Old Password

```json
{
  "error": "old_password is required when updating password"
}
```

### 400 Bad Request - Password Too Short

```json
{
  "error": "Password must be at least 6 characters long"
}
```

### 401 Unauthorized - Incorrect Current Password

```json
{
  "error": "Current password is incorrect"
}
```

### 401 Unauthorized - Missing Token

```json
{
  "error": "Unauthorized. Please provide a valid access token."
}
```

### 400 Bad Request - Full Name Empty

```json
{
  "error": "full_name cannot be empty"
}
```

---

## Usage Examples

### JavaScript/TypeScript (React Native)

#### Update Profile Only

```javascript
async function updateProfile(accessToken, fullName, imageUrl) {
  const response = await fetch(
    'https://your-domain.com/api/mobile/update-profile',
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: fullName,
        profile_image_url: imageUrl,
      }),
    }
  );

  const data = await response.json();
  return data;
}
```

#### Update Password Only

```javascript
async function updatePassword(accessToken, oldPassword, newPassword) {
  const response = await fetch(
    'https://your-domain.com/api/mobile/update-profile',
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: newPassword,
        old_password: oldPassword,
      }),
    }
  );

  const data = await response.json();

  if (response.ok && data.password_updated) {
    console.log('Password updated successfully!');
  } else if (data.error === 'Current password is incorrect') {
    console.error('Wrong current password');
  }

  return data;
}
```

#### Update Both Profile and Password

```javascript
async function updateProfileAndPassword(
  accessToken,
  fullName,
  oldPassword,
  newPassword
) {
  const response = await fetch(
    'https://your-domain.com/api/mobile/update-profile',
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: fullName,
        password: newPassword,
        old_password: oldPassword,
      }),
    }
  );

  const data = await response.json();
  return data;
}
```

### Complete React Native Example

```javascript
import { useState } from 'react';
import * as SecureStore from 'expo-secure-store';

function UpdatePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdatePassword = async () => {
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const accessToken = await SecureStore.getItemAsync('access_token');

      const response = await fetch(
        'https://your-domain.com/api/mobile/update-profile',
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: newPassword,
            old_password: currentPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Password updated successfully');
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Your UI here
  );
}
```

### cURL

#### Update Password

```bash
curl -X PUT https://your-domain.com/api/mobile/update-profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewPassword123",
    "old_password": "CurrentPassword"
  }'
```

#### Update Profile

```bash
curl -X PUT https://your-domain.com/api/mobile/update-profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "profile_image_url": "https://example.com/image.jpg"
  }'
```

---

## Security Considerations

### Password Verification Flow

1. **Old Password Check**: API attempts to sign in with old password
2. **If Valid**: Proceeds to update password in `auth.users`
3. **If Invalid**: Returns error without updating anything

### Why This Approach?

- **Security**: Current password must be verified before allowing change
- **Auth Table Isolation**: Passwords cannot be updated directly - must use Supabase Auth API
- **Stateless**: Token verification happens on every request

### Best Practices

1. **Always Verify Old Password**: Never allow password updates without current password verification
2. **Password Length**: Enforce minimum 6 characters (customize as needed)
3. **Secure Transmission**: Always use HTTPS
4. **Token Security**: Store access tokens in secure storage (not AsyncStorage)
5. **Error Messages**: Don't reveal whether email or password is wrong (security best practice)

---

## How It Works Internally

### Password Update Process

```
1. User sends request with new_password and old_password
   ↓
2. API extracts Bearer token from Authorization header
   ↓
3. API verifies token and gets user from auth.users
   ↓
4. API attempts to sign in with email + old_password
   ↓
5. If old_password is correct:
   ↓
6. API calls Supabase Auth updateUser({ password: new_password })
   ↓
7. Password updated in auth.users table by Supabase
   ↓
8. Returns success response
```

### Profile Update Process

```
1. User sends request with profile fields
   ↓
2. API verifies token and gets user
   ↓
3. API updates profiles table directly via SQL
   ↓
4. Returns updated profile data
```

---

## API Request Fields

| Field               | Type   | Required          | Description                       |
| ------------------- | ------ | ----------------- | --------------------------------- |
| `full_name`         | string | No (for password) | User's full name                  |
| `profile_image_url` | string | No                | Profile image URL                 |
| `password`          | string | Yes (for update)  | New password (min 6 chars)        |
| `old_password`      | string | Yes (if password) | Current password for verification |

**Note:** All fields are optional. You can update profile only, password only, or both.

---

## Database Schema

### Auth Users Table (managed by Supabase)

```sql
-- This table is managed by Supabase Auth
-- You don't directly interact with it via SQL
-- Use Supabase Auth API methods instead

auth.users {
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  encrypted_password TEXT,  -- Encrypted by Supabase
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  -- ... other auth fields
}
```

### Profiles Table (your custom table)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email_address TEXT,
  profile_image_url TEXT,
  account_details JSONB,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Testing

### Test Password Update

```bash
curl -X PUT http://localhost:3000/api/mobile/update-profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewPassword123",
    "old_password": "OldPassword"
  }'
```

### Test Profile Update

```bash
curl -X PUT http://localhost:3000/api/mobile/update-profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe"
  }'
```

---

## Common Errors and Solutions

### Error: "old_password is required when updating password"

**Cause:** Trying to update password without providing current password.

**Solution:** Always include `old_password` when updating password.

```json
{
  "password": "NewPassword",
  "old_password": "CurrentPassword"
}
```

### Error: "Current password is incorrect"

**Cause:** The provided `old_password` doesn't match the user's current password.

**Solution:** Verify the user knows their current password or implement "forgot password" flow.

### Error: "Password must be at least 6 characters long"

**Cause:** New password doesn't meet minimum length requirement.

**Solution:** Use a password with at least 6 characters.

---

## Related Endpoints

1. **Get Profile:** `GET /api/mobile/update-profile`
   - Get current user profile information

2. **Login:** `POST /api/auth/mobile/login`
   - Login and get access token

3. **Logout:** `POST /api/auth/mobile/logout`
   - Logout from mobile app

---

## Support

For issues or questions:

1. Check the error response for specific error messages
2. Verify your access token is valid and not expired
3. Ensure old_password is correct before updating password
4. Contact support if issues persist
