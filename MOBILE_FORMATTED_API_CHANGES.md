# Mobile Formatted API Changes

## Summary

Updated the `/api/mobile-home-data/formatted` endpoint to properly support mobile app authentication using Bearer tokens instead of cookie-based sessions.

## Changes Made

### 1. Authentication Method Changed

**File:** `src/app/api/mobile-home-data/formatted/route.ts`

**Before:**

```typescript
// Used cookie-based authentication (web only)
const supabase = createRouteHandlerClient({ cookies });
const {
  data: { session },
} = await supabase.auth.getSession();
```

**After:**

```typescript
// Now uses Bearer token authentication (mobile apps)
const authHeader = request.headers.get('authorization');
const token = authHeader.replace('Bearer ', '');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser(token);
```

### 2. Improved Developer Data Handling

Added backward compatibility to handle both:

- Full developer objects (new format stored by main route)
- Developer IDs only (legacy format)

```typescript
if (
  typeof selectedDevelopers[0] === 'object' &&
  selectedDevelopers[0] !== null
) {
  // Already have full developer objects
  developersArray = selectedDevelopers;
} else {
  // Have IDs only, fetch full details
  const { data: developers } = await supabaseAdmin
    .from('developers')
    .select('*')
    .in('id', selectedDevelopers);
  developersArray = developers;
}
```

### 3. Updated Error Messages

All error messages now reflect mobile app authentication requirements:

- ✅ "Unauthorized. Please provide a valid access token."
- ✅ "Invalid or expired access token. Please login again."

## How Mobile Apps Should Use This API

### Step 1: Login

```javascript
// POST /api/auth/mobile/login
const response = await fetch('https://your-domain.com/api/auth/mobile/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const { access_token } = await response.json();
// Store access_token securely
```

### Step 2: Access Formatted Data

```javascript
// GET /api/mobile-home-data/formatted
const response = await fetch(
  'https://your-domain.com/api/mobile-home-data/formatted',
  {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  }
);

const { data } = await response.json();
// data contains: featuredVideo, taglineText, properties, developers, stories
```

## Testing

### Using cURL

```bash
# 1. Login
curl -X POST https://your-domain.com/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Response will include access_token

# 2. Get formatted data
curl -X GET https://your-domain.com/api/mobile-home-data/formatted \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Using Postman

1. **Login Request:**
   - Method: POST
   - URL: `https://your-domain.com/api/auth/mobile/login`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "password123"
     }
     ```

2. **Get Formatted Data:**
   - Method: GET
   - URL: `https://your-domain.com/api/mobile-home-data/formatted`
   - Headers: `Authorization: Bearer <YOUR_TOKEN>`

## API Response Format

```json
{
  "data": {
    "featuredVideo": "https://supabase-url.com/storage/v1/object/public/videos/video.mp4",
    "taglineText": "Find Your Dream Property",
    "properties": {
      "Apartment": [
        {
          "id": "uuid",
          "project_name": "Luxury Apartments",
          "starting_price": 500000,
          "property_images": ["url1", "url2"],
          "property_types": {
            "id": "uuid",
            "name": "Apartment",
            "image_url": "..."
          },
          "property_status": {
            "id": "uuid",
            "name": "Under Construction",
            "color": "#ff9800"
          },
          "countries": { "id": "uuid", "name": "UAE" },
          "states": { "id": "uuid", "name": "Dubai" },
          "cities": { "id": "uuid", "name": "Dubai City" },
          "areas": { "id": "uuid", "name": "Downtown" },
          "developers": {
            "id": "uuid",
            "name": "Premium Developers",
            "description": "Leading developers",
            "image_url": "..."
          },
          "property_amenities": [
            {
              "amenity_id": "uuid",
              "amenities": {
                "id": "uuid",
                "name": "Swimming Pool",
                "image_url": "..."
              }
            }
          ]
        }
      ],
      "Villa": [...],
      "Townhouse": [...]
    },
    "developers": [
      {
        "id": "uuid",
        "name": "Premium Developers",
        "description": "Leading real estate developers since 2010",
        "image_url": "https://...",
        "website": "https://...",
        "is_active": true
      }
    ],
    "stories": [
      "https://supabase-url.com/storage/v1/object/public/mobile-stories/story1.jpg",
      "https://supabase-url.com/storage/v1/object/public/mobile-stories/story2.jpg"
    ]
  }
}
```

## Error Responses

### 401 - No Token Provided

```json
{
  "error": "Unauthorized. Please provide a valid access token."
}
```

### 401 - Invalid Token

```json
{
  "error": "Invalid or expired access token. Please login again."
}
```

### 404 - Profile Not Found

```json
{
  "error": "User profile not found. Please contact support."
}
```

## Security Considerations

1. **Token Storage:**
   - Mobile apps should store tokens in secure storage
   - React Native: Use `expo-secure-store` or `react-native-keychain`
   - Flutter: Use `flutter_secure_storage`

2. **HTTPS Only:**
   - Always use HTTPS in production
   - Never send tokens over HTTP

3. **Token Expiration:**
   - Access tokens expire after 1 hour by default
   - Implement token refresh logic or re-login flow

4. **Never Log Tokens:**
   - Don't log tokens in production
   - Sanitize logs before sending to error tracking services

## Compatibility

- ✅ **Mobile Apps:** Fully supported with Bearer token authentication
- ✅ **Web Apps:** Can still use if they manage tokens manually
- ❌ **Cookie-based Auth:** No longer supported (use main route `/api/mobile-home-data` for dashboard)

## Related Files

- `src/app/api/auth/mobile/login/route.ts` - Mobile login endpoint
- `src/app/api/auth/mobile/signup/route.ts` - Mobile signup endpoint
- `src/app/api/mobile-home-data/route.ts` - Main route (admin/dashboard, cookie-based)
- `src/app/api/mobile-home-data/formatted/route.ts` - Formatted route (mobile apps, token-based)
- `MOBILE_API_ACCESS.md` - Complete mobile API documentation

## Testing Checklist

- [ ] Mobile login works and returns access_token
- [ ] Formatted endpoint accepts Bearer token
- [ ] Formatted endpoint returns proper data structure
- [ ] Invalid token returns 401 error
- [ ] Missing token returns 401 error
- [ ] Token expiration is handled properly
- [ ] Both legacy (ID array) and new (object array) developer formats work

## Migration Notes

No database migration required. The changes are API-only and backward compatible with existing data.

## Next Steps

1. Update mobile app code to use the new authentication flow
2. Test token refresh logic
3. Implement error handling for 401 responses
4. Add loading states in mobile UI
5. Consider implementing token refresh endpoint if needed
