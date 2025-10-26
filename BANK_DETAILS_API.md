# Bank Details API Documentation

## Overview

This API endpoint allows mobile applications to fetch user bank details stored in the `account_details` column of the `profiles` table.

## Endpoint

### GET `/api/mobile/bank-details`

Fetches the bank details of the currently authenticated user.

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

**Method:** `GET`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body:** None

---

## Response

### Success Response (200 OK)

**When bank details exist:**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "email_address": "john@example.com"
  },
  "bank_details": {
    "bank_name": "State Bank of India",
    "account_number": "1234567890123456",
    "ifsc_code": "SBIN0001234",
    "updated_at": "2024-01-01T12:00:00Z"
  },
  "has_bank_details": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

**When no bank details exist:**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "email_address": "john@example.com"
  },
  "bank_details": {},
  "has_bank_details": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Error Responses

**401 Unauthorized - Missing or invalid token:**

```json
{
  "error": "Unauthorized. Please provide a valid access token."
}
```

**401 Unauthorized - Invalid token:**

```json
{
  "error": "Invalid or expired access token. Please login again."
}
```

**404 Not Found - Profile not found:**

```json
{
  "error": "Profile not found. Please contact support."
}
```

**500 Internal Server Error:**

```json
{
  "error": "Internal server error"
}
```

---

## Usage Examples

### JavaScript/TypeScript (React Native, etc.)

```javascript
async function getBankDetails(accessToken) {
  try {
    const response = await fetch(
      'https://your-domain.com/api/mobile/bank-details',
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
      if (data.has_bank_details) {
        console.log('Bank Name:', data.bank_details.bank_name);
        console.log('Account Number:', data.bank_details.account_number);
        console.log('IFSC Code:', data.bank_details.ifsc_code);
      } else {
        console.log('No bank details found');
      }

      return data;
    } else {
      console.error('Error:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to fetch bank details:', error);
    throw error;
  }
}
```

### cURL

```bash
curl -X GET https://your-domain.com/api/mobile/bank-details \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### Postman

1. **Method:** `GET`
2. **URL:** `https://your-domain.com/api/mobile/bank-details`
3. **Headers:**
   - `Authorization`: `Bearer YOUR_ACCESS_TOKEN`
   - `Content-Type`: `application/json`

---

## Bank Details Structure

The bank details are stored in the `account_details` JSONB column of the `profiles` table.

**Schema:**

```typescript
{
  bank_name: string; // Bank name (e.g., "State Bank of India")
  account_number: string; // Account number (9-18 digits)
  ifsc_code: string; // IFSC code (e.g., "SBIN0001234")
  updated_at: string; // ISO 8601 timestamp
}
```

---

## Integration with Other APIs

### Related Endpoints

1. **Update Bank Details:** `PUT /api/mobile/update-bank-details`
   - Use this to add or update bank details

2. **Get Full User Details:** `GET /api/mobile/user-details`
   - Returns complete user profile including basic info

3. **Login:** `POST /api/auth/mobile/login`
   - Get the access token needed for authentication

---

## Testing

Use the provided test script to test the API:

```bash
node test-bank-details-api.js
```

**Before running:**

1. Update `ACCESS_TOKEN` in the test file with a valid token
2. Get a token by logging in: `POST /api/auth/mobile/login`

---

## Database Schema

### Profiles Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email_address TEXT,
  profile_image_url TEXT,
  role TEXT DEFAULT 'user',
  account_details JSONB,  -- Stores bank details
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for better performance
CREATE INDEX idx_profiles_account_details ON profiles USING GIN (account_details);
```

---

## Security

- ✅ **Authentication Required:** Only authenticated users can access their bank details
- ✅ **User Isolation:** Users can only view their own bank details
- ✅ **Bearer Token:** Uses JWT-based authentication
- ✅ **Secure Storage:** Bank details stored in encrypted JSONB column

---

## Notes

- The `account_details` column may be empty if the user hasn't added bank details yet
- Use the `has_bank_details` flag to quickly check if details exist
- To update bank details, use `PUT /api/mobile/update-bank-details`
- All timestamps are in ISO 8601 format (UTC)

---

## Support

For issues or questions:

1. Check the error response for specific error messages
2. Verify your access token is valid and not expired
3. Ensure your user profile exists in the `profiles` table
4. Contact support if issues persist
