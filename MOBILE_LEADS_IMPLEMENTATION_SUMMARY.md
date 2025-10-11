# Mobile Leads API - Implementation Summary

## Overview

Created a complete mobile-specific API for leads management with token-based authentication, allowing mobile app users to add and view their own leads securely.

---

## Files Created

### 1. API Routes

#### `/src/app/api/mobile/leads/add/route.ts`

- **Purpose**: Add new leads from mobile app
- **Method**: POST
- **Authentication**: Bearer token (required)
- **Functionality**:
  - Validates Bearer token from Authorization header
  - Verifies user exists in profiles table
  - Validates all required fields
  - Creates lead associated with authenticated user
  - Returns created lead with success status

#### `/src/app/api/mobile/leads/route.ts`

- **Purpose**: Get leads for authenticated mobile user
- **Method**: GET
- **Authentication**: Bearer token (required)
- **Functionality**:
  - Validates Bearer token from Authorization header
  - Verifies user exists in profiles table
  - Returns only leads created by the authenticated user
  - Supports pagination (page, limit)
  - Supports filtering by status
  - Supports search (fullname, email, mobile_no)
  - Returns assigned user information if available

### 2. Documentation Files

#### `/MOBILE_LEADS_API.md`

- Complete API documentation
- Endpoint specifications
- Request/response examples
- Authentication guide
- Error handling guide
- Postman/Insomnia collection examples
- Security notes

#### `/test-mobile-leads-api.js`

- Automated test script
- Tests all endpoints
- Tests authentication flow
- Tests error cases
- Easy to run and modify

---

## API Endpoints

### Authentication Flow

```
1. POST /api/auth/mobile/login
   ↓ Returns access_token
2. Use token in Authorization: Bearer <token>
   ↓
3. Access protected endpoints
```

### Leads Endpoints

| Endpoint                | Method | Purpose          | Auth Required   |
| ----------------------- | ------ | ---------------- | --------------- |
| `/api/mobile/leads/add` | POST   | Add new lead     | ✅ Bearer token |
| `/api/mobile/leads`     | GET    | Get user's leads | ✅ Bearer token |

---

## Key Features

### 🔐 Security

- **Token Authentication**: Uses Bearer token in Authorization header
- **User Verification**: Validates token and checks user profile
- **Data Isolation**: Users only see their own leads
- **Input Validation**: Validates all required fields and formats
- **Email Validation**: Ensures valid email format

### 📊 Data Management

- **Auto-association**: Leads automatically linked to creator
- **Status Tracking**: Default status 'new' for new leads
- **Timestamp Tracking**: created_at and updated_at automatically managed

### 🔍 Filtering & Search

- **Pagination**: Configurable page and limit parameters
- **Status Filter**: Filter by lead status (new, contacted, qualified, converted, lost)
- **Search**: Search across fullname, email, and mobile_no
- **Combined Filters**: Use multiple filters simultaneously

### 👥 Assignment Support

- Returns assigned user information if lead is assigned by admin
- Shows assigned user's email and metadata

---

## Request/Response Examples

### Add Lead

**Request:**

```bash
POST /api/mobile/leads/add
Authorization: Bearer eyJhbGc...
Content-Type: application/json

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

**Response:**

```json
{
  "success": true,
  "message": "Lead created successfully",
  "lead": {
    "id": "uuid",
    "fullname": "John Doe",
    "status": "new",
    "created_by": "user-uuid",
    "created_at": "2025-10-11T10:30:00Z",
    ...
  }
}
```

### Get Leads

**Request:**

```bash
GET /api/mobile/leads?page=1&limit=10&status=new
Authorization: Bearer eyJhbGc...
```

**Response:**

```json
{
  "success": true,
  "leads": [
    {
      "id": "uuid",
      "fullname": "John Doe",
      "status": "new",
      "assigned_user": null,
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## Required Lead Fields

| Field               | Type   | Required | Description                 |
| ------------------- | ------ | -------- | --------------------------- |
| `fullname`          | string | ✅       | Full name of the lead       |
| `mobile_no`         | string | ✅       | Phone number                |
| `email`             | string | ✅       | Email address (validated)   |
| `relationship`      | string | ✅       | Relationship type           |
| `budget`            | number | ✅       | Budget amount               |
| `purpose_of_buying` | string | ✅       | Purchase purpose            |
| `buying_timeline`   | string | ✅       | Expected timeline           |
| `notes`             | string | ❌       | Additional notes (optional) |

---

## Lead Status Values

- `new` - Default status for new leads
- `contacted` - Lead has been contacted
- `qualified` - Lead is qualified
- `converted` - Lead converted to customer
- `lost` - Lead is no longer interested

---

## Comparison: Web vs Mobile APIs

| Feature             | Web Dashboard     | Mobile App                   |
| ------------------- | ----------------- | ---------------------------- |
| **Endpoint**        | `/api/leads`      | `/api/mobile/leads/*`        |
| **Authentication**  | Cookie-based      | Bearer token                 |
| **Lead Visibility** | All leads (admin) | Only own leads               |
| **Add Lead**        | `POST /api/leads` | `POST /api/mobile/leads/add` |
| **Get Leads**       | `GET /api/leads`  | `GET /api/mobile/leads`      |
| **Update Lead**     | ✅ Supported      | ❌ Not implemented           |
| **Delete Lead**     | ✅ Supported      | ❌ Not implemented           |
| **Assign Lead**     | ✅ Supported      | ❌ Not implemented           |

**Why separate endpoints?**

1. Different authentication mechanisms
2. Different data isolation requirements
3. Mobile users should only manage their own leads
4. Simpler API surface for mobile apps
5. Better security boundaries

---

## Testing

### Quick Test with curl

1. **Login:**

```bash
curl -X POST http://localhost:3000/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

2. **Add Lead:**

```bash
curl -X POST http://localhost:3000/api/mobile/leads/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname":"John Doe",
    "mobile_no":"+1234567890",
    "email":"john@example.com",
    "relationship":"Friend",
    "budget":500000,
    "purpose_of_buying":"Investment",
    "buying_timeline":"3-6 months"
  }'
```

3. **Get Leads:**

```bash
curl -X GET http://localhost:3000/api/mobile/leads \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Automated Test Script

Run the provided test script:

```bash
node test-mobile-leads-api.js
```

Update the credentials in the script:

```javascript
const TEST_USER = {
  email: 'your-email@example.com',
  password: 'your-password',
};
```

---

## Error Handling

### Common Errors

#### 401 Unauthorized

```json
{
  "error": "Unauthorized. Please provide a valid access token."
}
```

**Solution**: Include Bearer token in Authorization header

#### 400 Bad Request

```json
{
  "error": "Missing required fields. Required: fullname, mobile_no, email, ..."
}
```

**Solution**: Include all required fields in request body

#### 400 Invalid Email

```json
{
  "error": "Invalid email format"
}
```

**Solution**: Provide valid email address

#### 404 Profile Not Found

```json
{
  "error": "User profile not found. Please contact support."
}
```

**Solution**: Contact admin to verify user account

---

## Security Implementation

### Token Verification Process

1. Extract Authorization header
2. Validate Bearer token format
3. Verify token with Supabase auth
4. Check user exists in profiles table
5. Execute authorized operation

### Data Isolation

- All queries filtered by `created_by = user.id`
- Users cannot access other users' leads
- Admin client used only after user verification

### Input Validation

- All required fields checked
- Email format validated with regex
- Budget converted to float
- SQL injection prevention through parameterized queries

---

## Integration Guide for Mobile Apps

### 1. Authentication

```typescript
// Login
const loginResponse = await fetch('/api/auth/mobile/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const { access_token } = await loginResponse.json();

// Store token securely
await SecureStore.setItemAsync('access_token', access_token);
```

### 2. Add Lead

```typescript
const token = await SecureStore.getItemAsync('access_token');

const response = await fetch('/api/mobile/leads/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(leadData),
});

const result = await response.json();
```

### 3. Get Leads

```typescript
const token = await SecureStore.getItemAsync('access_token');

const response = await fetch('/api/mobile/leads?page=1&limit=10', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const { leads, pagination } = await response.json();
```

### 4. Handle Token Expiration

```typescript
if (response.status === 401) {
  // Token expired, redirect to login
  await SecureStore.deleteItemAsync('access_token');
  navigation.navigate('Login');
}
```

---

## Database Schema

The leads API uses the `leads` table with the following key columns:

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  fullname TEXT NOT NULL,
  mobile_no TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship TEXT NOT NULL,
  budget NUMERIC NOT NULL,
  purpose_of_buying TEXT NOT NULL,
  buying_timeline TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'new',
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Future Enhancements

### Potential Features to Add:

1. **Update Lead**: Allow users to update their own leads
2. **Delete Lead**: Allow users to delete their own leads
3. **Lead Notes**: Add ability to add notes/comments to leads
4. **Lead Sharing**: Share leads with team members
5. **Lead Analytics**: Get statistics about user's leads
6. **Push Notifications**: Notify when lead status changes
7. **Export Leads**: Export user's leads to CSV/PDF
8. **Bulk Operations**: Add multiple leads at once

---

## Support & Maintenance

### Monitoring

- Check logs for authentication errors
- Monitor failed lead creation attempts
- Track API response times

### Common Issues

1. **Token Expiration**: Implement refresh token logic
2. **Network Errors**: Add retry logic in mobile app
3. **Validation Errors**: Show clear error messages to users

### Debugging

- Check server logs for detailed error messages
- Use test script to verify API functionality
- Test with Postman/Insomnia for manual verification

---

## Summary

✅ **Created**: Secure mobile API endpoints for leads management  
✅ **Implemented**: Bearer token authentication  
✅ **Isolated**: User data (users only see own leads)  
✅ **Validated**: All input with proper error messages  
✅ **Documented**: Complete API documentation and examples  
✅ **Tested**: Comprehensive test script provided

The mobile leads API is ready for integration with your mobile application! 🚀
