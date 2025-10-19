# Mobile Profile Management Implementation

## Overview

This implementation adds comprehensive profile management functionality for mobile devices, including profile image uploads and profile information updates with token-based authentication.

## Features Implemented

### 1. Database Schema Updates

#### New Columns Added to `profiles` Table:

- `profile_image_url` (TEXT) - Stores the URL of the user's profile image
- `email_address` (TEXT) - Stores the user's email address (synced from auth.users)
- `account_details` (JSONB) - Stores bank details in JSON format

#### Database Triggers:

- **Email Sync Trigger**: Automatically syncs email from `auth.users` to `profiles.email_address`
- **Profile Creation Trigger**: Automatically creates a profile when a new user signs up
- **Updated At Trigger**: Automatically updates the `updated_at` timestamp

### 2. API Endpoints

#### `/api/mobile/user-details` (GET)

**Purpose**: Get logged-in user details from auth.users and profiles table

**Headers Required**:

```
Authorization: Bearer <access_token>
```

**Response**:

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "email_confirmed_at": "2024-01-01T00:00:00Z",
    "phone": "+1234567890",
    "phone_confirmed_at": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "last_sign_in_at": "2024-01-01T00:00:00Z",
    "app_metadata": {},
    "user_metadata": {
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "aud": "authenticated",
    "role": "authenticated",
    "profile": {
      "id": "uuid",
      "full_name": "John Doe",
      "email_address": "john@example.com",
      "profile_image_url": "https://example.com/image.jpg",
      "role": "user",
      "totalleads": "10",
      "commissions": {...},
      "notes": "Additional notes",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### `/api/mobile/user-details` (PUT)

**Purpose**: Update user metadata in auth.users

**Headers Required**:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body** (at least one field required):

```json
{
  "user_metadata": {
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  },
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  }
}
```

**Response**:

```json
{
  "success": true,
  "message": "User metadata updated successfully",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "email_confirmed_at": "2024-01-01T00:00:00Z",
    "phone": "+1234567890",
    "phone_confirmed_at": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "last_sign_in_at": "2024-01-01T00:00:00Z",
    "app_metadata": {
      "provider": "email",
      "providers": ["email"]
    },
    "user_metadata": {
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "preferences": {
        "theme": "dark",
        "notifications": true
      }
    },
    "aud": "authenticated",
    "role": "authenticated",
    "profile": {
      "id": "uuid",
      "full_name": "John Doe",
      "email_address": "john@example.com",
      "profile_image_url": "https://example.com/image.jpg",
      "role": "user",
      "totalleads": "10",
      "commissions": {...},
      "notes": "Additional notes",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### `/api/mobile/update-profile` (PUT)

**Purpose**: Update user profile information

**Headers Required**:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:

- `full_name` (required) - User's full name
- `profile_image_url` (optional) - Profile image URL (can be empty)

```json
{
  "full_name": "John Doe",
  "profile_image_url": "https://example.com/image.jpg"
}
```

**Note**: `full_name` is required and cannot be empty. `profile_image_url` is optional and can be an empty string.

**Example with empty profile_image_url**:

```json
{
  "full_name": "John Doe",
  "profile_image_url": ""
}
```

**Response**:

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "email_address": "john@example.com",
    "profile_image_url": "https://example.com/image.jpg",
    "role": "user",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### `/api/mobile/update-profile` (GET)

**Purpose**: Get current user's profile information

**Headers Required**:

```
Authorization: Bearer <access_token>
```

**Response**:

```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "email_address": "john@example.com",
    "profile_image_url": "https://example.com/image.jpg",
    "role": "user",
    "totalleads": "10",
    "commissions": {...},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### `/api/mobile/update-profile-image` (POST)

**Purpose**: Upload profile image

**Headers Required**:

```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body**:

```
image: <File> (JPEG, PNG, WebP, max 5MB)
```

**Response**:

```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "image_url": "https://supabase.co/storage/v1/object/public/profile-images/uuid-timestamp.jpg",
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "email_address": "john@example.com",
    "profile_image_url": "https://supabase.co/storage/v1/object/public/profile-images/uuid-timestamp.jpg",
    "role": "user",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### `/api/mobile/update-profile-image` (DELETE)

**Purpose**: Delete profile image

**Headers Required**:

```
Authorization: Bearer <access_token>
```

**Response**:

```json
{
  "success": true,
  "message": "Profile image deleted successfully",
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "email_address": "john@example.com",
    "profile_image_url": null,
    "role": "user",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### `/api/mobile/update-bank-details` (PUT)

**Purpose**: Update bank details

**Headers Required**:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body** (all fields required):

```json
{
  "bank_name": "State Bank of India",
  "account_number": "1234567890123456",
  "confirm_account_number": "1234567890123456",
  "ifsc_code": "SBIN0001234"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Bank details updated successfully",
  "account_details": {
    "bank_name": "State Bank of India",
    "account_number": "1234567890123456",
    "ifsc_code": "SBIN0001234",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "email_address": "john@example.com",
    "profile_image_url": "https://example.com/image.jpg",
    "role": "user",
    "account_details": {
      "bank_name": "State Bank of India",
      "account_number": "1234567890123456",
      "ifsc_code": "SBIN0001234",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### `/api/mobile/update-bank-details` (GET)

**Purpose**: Get bank details

**Headers Required**:

```
Authorization: Bearer <access_token>
```

**Response**:

```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "email_address": "john@example.com",
    "profile_image_url": "https://example.com/image.jpg",
    "role": "user",
    "account_details": {
      "bank_name": "State Bank of India",
      "account_number": "1234567890123456",
      "ifsc_code": "SBIN0001234",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### `/api/mobile/update-bank-details` (DELETE)

**Purpose**: Delete bank details

**Headers Required**:

```
Authorization: Bearer <access_token>
```

**Response**:

```json
{
  "success": true,
  "message": "Bank details deleted successfully",
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "email_address": "john@example.com",
    "profile_image_url": "https://example.com/image.jpg",
    "role": "user",
    "account_details": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 3. Storage Setup

#### Supabase Storage Bucket: `profile-images`

- **Public Access**: Yes (for direct image URL access)
- **Allowed MIME Types**: image/jpeg, image/jpg, image/png, image/webp
- **File Size Limit**: 5MB
- **File Naming**: `{user_id}-{timestamp}.{extension}`

#### RLS Policies:

1. **Upload Policy**: Users can upload their own profile images
2. **Read Policy**: Public can view profile images
3. **Delete Policy**: Users can delete their own profile images

## Setup Instructions

### 1. Database Migration

Run the database migration to add the new columns and triggers:

```sql
-- Execute the contents of database/profiles_add_image_email_columns.sql
```

### 2. Storage Bucket Setup

Run the setup script to create the storage bucket:

```bash
node setup-profile-images-bucket.js
```

### 3. Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Usage Examples

### Mobile App Integration

#### Update Profile Information

```javascript
const updateProfile = async profileData => {
  const response = await fetch('/api/mobile/update-profile', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      full_name: profileData.fullName,
      profile_image_url: profileData.profileImageUrl,
    }),
  });

  return await response.json();
};
```

#### Upload Profile Image

```javascript
const uploadProfileImage = async imageFile => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('/api/mobile/update-profile-image', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  return await response.json();
};
```

#### Get User Details

```javascript
const getUserDetails = async () => {
  const response = await fetch('/api/mobile/user-details', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json();
};
```

#### Update User Metadata

```javascript
const updateUserMetadata = async metadata => {
  const response = await fetch('/api/mobile/user-details', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_metadata: metadata.userMetadata,
      app_metadata: metadata.appMetadata,
    }),
  });

  return await response.json();
};
```

#### Get Profile Information

```javascript
const getProfile = async () => {
  const response = await fetch('/api/mobile/update-profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json();
};
```

#### Update Bank Details

```javascript
const updateBankDetails = async bankData => {
  const response = await fetch('/api/mobile/update-bank-details', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bank_name: bankData.bankName,
      account_number: bankData.accountNumber,
      confirm_account_number: bankData.confirmAccountNumber,
      ifsc_code: bankData.ifscCode,
    }),
  });

  return await response.json();
};
```

#### Get Bank Details

```javascript
const getBankDetails = async () => {
  const response = await fetch('/api/mobile/update-bank-details', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json();
};
```

#### Delete Bank Details

```javascript
const deleteBankDetails = async () => {
  const response = await fetch('/api/mobile/update-bank-details', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return await response.json();
};
```

## Security Features

1. **Token Authentication**: All endpoints require valid access tokens
2. **User Isolation**: Users can only access and modify their own profiles
3. **File Validation**: Image uploads are validated for type and size
4. **RLS Policies**: Database and storage access is protected by Row Level Security
5. **Error Handling**: Comprehensive error handling with appropriate HTTP status codes

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

Common HTTP status codes:

- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not Found (profile not found)
- `500`: Internal Server Error

## File Structure

```
src/app/api/mobile/
├── user-details/
│   └── route.ts          # User details and metadata management
├── update-profile/
│   └── route.ts          # Profile update and retrieval
├── update-profile-image/
│   └── route.ts          # Image upload and deletion
└── update-bank-details/
    └── route.ts          # Bank details management

database/
├── profiles_add_image_email_columns.sql  # Database migration
└── profiles_add_account_details_column.sql  # Bank details migration

setup-profile-images-bucket.js           # Storage bucket setup
```

## Testing

You can test the endpoints using tools like Postman or curl:

```bash
# Get user details (auth + profile)
curl -X GET "https://your-domain.com/api/mobile/user-details" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Update user metadata
curl -X PUT "https://your-domain.com/api/mobile/user-details" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_metadata": {"preferences": {"theme": "dark"}}}'

# Get profile only
curl -X GET "https://your-domain.com/api/mobile/update-profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Update profile (full_name is required)
curl -X PUT "https://your-domain.com/api/mobile/update-profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "John Doe", "profile_image_url": "https://example.com/image.jpg"}'

# Update profile with empty image URL
curl -X PUT "https://your-domain.com/api/mobile/update-profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "John Doe", "profile_image_url": ""}'

# Upload image
curl -X POST "https://your-domain.com/api/mobile/update-profile-image" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@/path/to/image.jpg"

# Update bank details
curl -X PUT "https://your-domain.com/api/mobile/update-bank-details" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bank_name": "State Bank of India", "account_number": "1234567890123456", "confirm_account_number": "1234567890123456", "ifsc_code": "SBIN0001234"}'

# Get bank details
curl -X GET "https://your-domain.com/api/mobile/update-bank-details" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Delete bank details
curl -X DELETE "https://your-domain.com/api/mobile/update-bank-details" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Notes

- Profile images are stored in Supabase Storage with public URLs
- Email addresses are automatically synced from the auth system
- All profile updates include automatic timestamp updates
- The system handles file cleanup if profile updates fail
- Images are organized by user ID and timestamp for easy management
