# Mobile Leads API Documentation

This document describes the mobile-specific API endpoints for leads management with token-based authentication.

## Overview

The mobile leads API allows mobile app users to:

1. Add new leads
2. View their own leads with filtering and pagination

All endpoints require Bearer token authentication obtained through the mobile login flow.

---

## Authentication

All mobile leads endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Getting an Access Token

Use the mobile login endpoint to obtain an access token:

**Endpoint:** `POST /api/auth/mobile/login`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "v1.MRjHF8c4...",
  "expires_in": 3600,
  "expires_at": 1234567890,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    ...
  },
  "profile": {
    "full_name": "John Doe",
    "email_address": "user@example.com",
    "profile_image_url": "https://...",
    "role": "user",
    "totalleads": "25",
    "commissions": {...},
    "notes": "Important notes about the user",
    "account_details": {...},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T00:00:00Z"
  }
}
```

Use the `access_token` from this response for subsequent API calls. The `profile` field contains additional user profile information from the profiles table.

---

## Endpoints

### 1. Add Lead

Create a new lead associated with the authenticated user.

**Endpoint:** `POST /api/mobile/leads/add`

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "fullname": "John Doe",
  "mobile_no": "+1234567890",
  "email": "john.doe@example.com",
  "relationship": "Friend",
  "budget": 500000,
  "purpose_of_buying": "Investment",
  "buying_timeline": "3-6 months",
  "notes": "Interested in waterfront properties"
}
```

**Field Descriptions:**

- `fullname` (required): Full name of the lead
- `mobile_no` (required): Phone number of the lead
- `email` (required): Email address (must be valid format)
- `relationship` (required): Relationship to the lead (e.g., "Friend", "Family", "Colleague", "Referral")
- `budget` (required): Budget in numeric format
- `purpose_of_buying` (required): Purpose for buying (e.g., "Investment", "Personal Use", "Resale")
- `buying_timeline` (required): Expected timeline (e.g., "Immediate", "1-3 months", "3-6 months", "6-12 months", "1+ year")
- `notes` (optional): Additional notes about the lead

**Success Response (201):**

```json
{
  "success": true,
  "message": "Lead created successfully",
  "lead": {
    "id": "lead-uuid",
    "fullname": "John Doe",
    "mobile_no": "+1234567890",
    "email": "john.doe@example.com",
    "relationship": "Friend",
    "budget": 500000,
    "purpose_of_buying": "Investment",
    "buying_timeline": "3-6 months",
    "notes": "Interested in waterfront properties",
    "status": "new",
    "created_by": "user-uuid",
    "assigned_to": null,
    "created_at": "2025-10-11T10:30:00Z",
    "updated_at": "2025-10-11T10:30:00Z"
  }
}
```

**Error Responses:**

- **401 Unauthorized:**

```json
{
  "error": "Unauthorized. Please provide a valid access token."
}
```

- **400 Bad Request:**

```json
{
  "error": "Missing required fields. Required: fullname, mobile_no, email, relationship, budget, purpose_of_buying, buying_timeline"
}
```

- **400 Invalid Email:**

```json
{
  "error": "Invalid email format"
}
```

---

### 2. Get Leads

Retrieve all leads created by the authenticated user with pagination and filtering.

**Endpoint:** `GET /api/mobile/leads`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)
- `status` (optional): Filter by status
  - Possible values: `new`, `contacted`, `qualified`, `converted`, `lost`, `all`
- `search` (optional): Search in fullname, email, or mobile_no

**Example Requests:**

1. Get first page (default 10 leads):

```
GET /api/mobile/leads
```

2. Get page 2 with 20 leads per page:

```
GET /api/mobile/leads?page=2&limit=20
```

3. Filter by status:

```
GET /api/mobile/leads?status=new
```

4. Search for leads:

```
GET /api/mobile/leads?search=john
```

5. Combined filters:

```
GET /api/mobile/leads?page=1&limit=10&status=contacted&search=doe
```

**Success Response (200):**

```json
{
  "success": true,
  "leads": [
    {
      "id": "lead-uuid-1",
      "fullname": "John Doe",
      "mobile_no": "+1234567890",
      "email": "john.doe@example.com",
      "relationship": "Friend",
      "budget": 500000,
      "purpose_of_buying": "Investment",
      "buying_timeline": "3-6 months",
      "notes": "Interested in waterfront properties",
      "status": "new",
      "created_by": "user-uuid",
      "assigned_to": null,
      "created_at": "2025-10-11T10:30:00Z",
      "updated_at": "2025-10-11T10:30:00Z",
      "assigned_user": null
    },
    {
      "id": "lead-uuid-2",
      "fullname": "Jane Smith",
      "mobile_no": "+9876543210",
      "email": "jane.smith@example.com",
      "relationship": "Colleague",
      "budget": 750000,
      "purpose_of_buying": "Personal Use",
      "buying_timeline": "1-3 months",
      "notes": null,
      "status": "contacted",
      "created_by": "user-uuid",
      "assigned_to": "admin-uuid",
      "created_at": "2025-10-10T15:20:00Z",
      "updated_at": "2025-10-11T09:15:00Z",
      "assigned_user": {
        "id": "admin-uuid",
        "email": "admin@example.com",
        "user_metadata": {
          "fullname": "Admin User"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

**Error Responses:**

- **401 Unauthorized:**

```json
{
  "error": "Unauthorized. Please provide a valid access token."
}
```

- **401 Invalid Token:**

```json
{
  "error": "Invalid or expired access token. Please login again."
}
```

- **404 Profile Not Found:**

```json
{
  "error": "User profile not found. Please contact support."
}
```

---

## Lead Status Values

Leads can have the following status values:

- `new` - Newly created lead (default)
- `contacted` - Lead has been contacted
- `qualified` - Lead is qualified and interested
- `converted` - Lead has been converted to a customer
- `lost` - Lead is no longer interested or unreachable

---

## Data Isolation

**Important:** Mobile users can only see and manage leads they have created. The `created_by` field automatically links leads to the authenticated user. Admins managing leads through the web dashboard may assign leads to users, but mobile users will still only see their own created leads.

---

## Complete Mobile App Flow Example

### Step 1: Login

```bash
curl -X POST https://your-domain.com/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:

```json
{
  "success": true,
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

### Step 2: Add a Lead

```bash
curl -X POST https://your-domain.com/api/mobile/leads/add \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "John Doe",
    "mobile_no": "+1234567890",
    "email": "john.doe@example.com",
    "relationship": "Friend",
    "budget": 500000,
    "purpose_of_buying": "Investment",
    "buying_timeline": "3-6 months",
    "notes": "Looking for 2-bedroom apartments"
  }'
```

### Step 3: Get User's Leads

```bash
curl -X GET "https://your-domain.com/api/mobile/leads?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGc..."
```

### Step 4: Search Leads

```bash
curl -X GET "https://your-domain.com/api/mobile/leads?search=john" \
  -H "Authorization: Bearer eyJhbGc..."
```

### Step 5: Filter by Status

```bash
curl -X GET "https://your-domain.com/api/mobile/leads?status=new" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "Error message describing what went wrong",
  "details": "Optional additional error details"
}
```

Common HTTP status codes:

- `200` - Success (GET requests)
- `201` - Created (POST requests)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication errors)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error (server errors)

---

## Testing with Postman/Insomnia

### Collection Variables

Create these variables for easy testing:

- `base_url`: Your API base URL (e.g., `http://localhost:3000`)
- `access_token`: Your current access token

### Example Postman Collection

1. **Login**
   - Method: POST
   - URL: `{{base_url}}/api/auth/mobile/login`
   - Body (JSON):
     ```json
     {
       "email": "user@example.com",
       "password": "password123"
     }
     ```
   - Test Script (to save token):
     ```javascript
     pm.environment.set(
       'access_token',
       pm.response.json().session.access_token
     );
     ```

2. **Add Lead**
   - Method: POST
   - URL: `{{base_url}}/api/mobile/leads/add`
   - Headers: `Authorization: Bearer {{access_token}}`
   - Body (JSON): [See request body above]

3. **Get Leads**
   - Method: GET
   - URL: `{{base_url}}/api/mobile/leads`
   - Headers: `Authorization: Bearer {{access_token}}`

---

## Security Notes

1. **Token Security**: Store access tokens securely in your mobile app (use KeyChain on iOS, KeyStore on Android)
2. **Token Expiration**: Implement token refresh logic using the refresh_token
3. **HTTPS Only**: Always use HTTPS in production
4. **Data Isolation**: Users can only access their own leads
5. **Input Validation**: All input is validated on the server side

---

## Differences from Web Dashboard Leads API

| Feature            | Web Dashboard (`/api/leads`) | Mobile App (`/api/mobile/leads`) |
| ------------------ | ---------------------------- | -------------------------------- |
| Authentication     | Cookie-based (session)       | Bearer token                     |
| Lead Visibility    | All leads (admin view)       | Only user's own leads            |
| Add Lead Endpoint  | `POST /api/leads`            | `POST /api/mobile/leads/add`     |
| Get Leads Endpoint | `GET /api/leads`             | `GET /api/mobile/leads`          |
| Update Lead        | ✅ Supported                 | ❌ Not implemented               |
| Delete Lead        | ✅ Supported                 | ❌ Not implemented               |
| Assign Lead        | ✅ Supported (web only)      | ❌ Not implemented               |

---

## Next Steps

For mobile app development:

1. Implement token storage and management
2. Create lead forms using the required fields
3. Implement lead listing with pagination
4. Add search and filter functionality
5. Handle token expiration and refresh
6. Implement error handling and user feedback

For questions or issues, contact the development team.
