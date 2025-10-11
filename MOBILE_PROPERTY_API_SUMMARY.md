# Mobile Property API - Quick Summary

## Endpoint

```
GET /api/mobile/properties/{propertyId}
```

---

## What You Need

### 1. Authorization Header (Required)

```
Authorization: Bearer <your_access_token>
```

### 2. Property ID in URL (Required)

Replace `{propertyId}` with the actual UUID of the property.

---

## Example Request

### cURL

```bash
curl -X GET "http://localhost:3000/api/mobile/properties/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript/Fetch

```javascript
const propertyId = '123e4567-e89b-12d3-a456-426614174000';
const token = 'YOUR_ACCESS_TOKEN';

const response = await fetch(
  `http://localhost:3000/api/mobile/properties/${propertyId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = await response.json();
console.log(data.property);
```

---

## What You Get Back

### Success Response (200)

```json
{
  "success": true,
  "property": {
    "id": "uuid",
    "projectName": "Luxury Residences",
    "startingPrice": 1500000,
    "images": ["url1", "url2", "url3"],
    "thumbnail": "thumbnail-url",
    "brochureUrl": "brochure-pdf-url",
    "paymentPlan": "20/80",
    "handover": "Q4 2025",
    "expectedAppreciation": "15-20%",
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-10-11T15:45:00Z",

    "propertyType": {
      "name": "Apartment",
      "description": "Residential apartment units",
      "imageUrl": "icon-url"
    },

    "status": {
      "id": "status-uuid",
      "name": "Under Construction",
      "color": "#FFA500"
    },

    "location": {
      "country": "United Arab Emirates",
      "state": "Dubai",
      "city": "Dubai",
      "area": "Dubai Marina"
    },

    "developer": {
      "name": "Emaar Properties",
      "description": "Leading real estate developer in the UAE",
      "imageUrl": "logo-url",
      "website": "https://www.emaar.com",
      "email": "info@emaar.com",
      "phone": "+971-4-123-4567",
      "address": "Downtown Dubai, UAE"
    },

    "amenities": [
      { "name": "Swimming Pool", "imageUrl": "icon-url" },
      { "name": "Gym", "imageUrl": "icon-url" },
      { "name": "Parking", "imageUrl": "icon-url" }
    ]
  }
}
```

---

## Error Responses

### 401 - No Token or Invalid Token

```json
{
  "error": "Unauthorized. Please provide a valid access token."
}
```

**Solution**: Include valid Bearer token in Authorization header.

### 404 - Property Not Found

```json
{
  "error": "Property not found"
}
```

**Solution**: Check that the property ID is correct and exists.

### 400 - Missing Property ID

```json
{
  "error": "Property ID is required"
}
```

**Solution**: Include property ID in the URL.

---

## Complete Flow Example

### Step 1: Login

```javascript
const loginResponse = await fetch(
  'http://localhost:3000/api/auth/mobile/login',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'password123',
    }),
  }
);

const { access_token } = await loginResponse.json();
```

### Step 2: Get Property

```javascript
const propertyResponse = await fetch(
  `http://localhost:3000/api/mobile/properties/${propertyId}`,
  {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  }
);

const { property } = await propertyResponse.json();
```

### Step 3: Use Property Data

```javascript
console.log('Project:', property.projectName);
console.log('Price:', property.startingPrice);
console.log('Location:', property.location.area.name);
console.log('Developer:', property.developer.name);
console.log('Images:', property.images);
console.log('Amenities:', property.amenities);
```

---

## What's Included in Response

✅ **Basic Info**: ID, project name, price, dates  
✅ **Media**: Images array, thumbnail, brochure URL  
✅ **Details**: Payment plan, handover, appreciation  
✅ **Property Type**: Type name and icon  
✅ **Status**: Current status with color  
✅ **Location**: Country, state, city, area (full hierarchy)  
✅ **Developer**: Complete developer information  
✅ **Amenities**: List of all amenities with icons

---

## Key Points

1. ✅ **Authentication Required**: Must include Bearer token
2. ✅ **Single Property**: Returns one property by ID
3. ✅ **Complete Data**: Includes all related information
4. ✅ **Formatted for Mobile**: Camel case, clean structure
5. ✅ **Ready to Display**: All data needed for detail screen

---

## Quick Test

```bash
# 1. Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.access_token')

# 2. Get property
curl -X GET "http://localhost:3000/api/mobile/properties/YOUR_PROPERTY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

---

## Files

- **API Route**: `src/app/api/mobile/properties/[id]/route.ts`
- **Full Documentation**: `MOBILE_PROPERTY_API.md`
- **Quick Reference**: `MOBILE_LEADS_QUICK_REFERENCE.md`

---

That's it! Simple and straightforward. 🚀
