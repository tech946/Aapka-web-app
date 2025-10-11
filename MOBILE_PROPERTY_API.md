# Mobile Property API Documentation

## Overview

This endpoint allows mobile app users to retrieve detailed information about a specific property using its ID.

**Endpoint:** `GET /api/mobile/properties/{id}`

**Authentication:** Bearer token (required)

---

## Request

### Endpoint Format

```
GET /api/mobile/properties/{propertyId}
```

Replace `{propertyId}` with the actual UUID of the property.

### Headers

```
Authorization: Bearer <access_token>
```

### Path Parameter

- **id** (required): The UUID of the property

---

## Response

### Success Response (200)

```json
{
  "success": true,
  "property": {
    "id": "property-uuid",
    "projectName": "Luxury Waterfront Residences",
    "startingPrice": 1500000,
    "images": [
      "https://storage.url/property1.jpg",
      "https://storage.url/property2.jpg",
      "https://storage.url/property3.jpg"
    ],
    "thumbnail": "https://storage.url/thumbnail.jpg",
    "brochureUrl": "https://storage.url/brochure.pdf",
    "paymentPlan": "20/80 payment plan",
    "handover": "Q4 2025",
    "expectedAppreciation": "15-20%",
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-10-11T15:45:00Z",
    
    "propertyType": {
      "id": "type-uuid",
      "name": "Apartment",
      "imageUrl": "https://storage.url/apartment-icon.png"
    },
    
    "status": {
      "id": "status-uuid",
      "name": "Under Construction",
      "color": "#FFA500"
    },
    
    "location": {
      "country": {
        "id": "country-uuid",
        "name": "United Arab Emirates"
      },
      "state": {
        "id": "state-uuid",
        "name": "Dubai"
      },
      "city": {
        "id": "city-uuid",
        "name": "Dubai"
      },
      "area": {
        "id": "area-uuid",
        "name": "Dubai Marina"
      }
    },
    
    "developer": {
      "id": "developer-uuid",
      "name": "Emaar Properties",
      "description": "Leading real estate developer in the UAE",
      "imageUrl": "https://storage.url/emaar-logo.png",
      "logoUrl": "https://storage.url/emaar-logo-small.png",
      "website": "https://www.emaar.com",
      "contactEmail": "info@emaar.com",
      "contactPhone": "+971-4-123-4567"
    },
    
    "amenities": [
      {
        "id": "amenity-1",
        "name": "Swimming Pool",
        "imageUrl": "https://storage.url/pool-icon.png"
      },
      {
        "id": "amenity-2",
        "name": "Gym",
        "imageUrl": "https://storage.url/gym-icon.png"
      },
      {
        "id": "amenity-3",
        "name": "Parking",
        "imageUrl": "https://storage.url/parking-icon.png"
      }
    ]
  }
}
```

### Error Responses

#### 401 Unauthorized (No Token)
```json
{
  "error": "Unauthorized. Please provide a valid access token."
}
```

#### 401 Unauthorized (Invalid Token)
```json
{
  "error": "Invalid or expired access token. Please login again."
}
```

#### 404 Not Found (User Profile)
```json
{
  "error": "User profile not found. Please contact support."
}
```

#### 404 Not Found (Property)
```json
{
  "error": "Property not found"
}
```

#### 400 Bad Request
```json
{
  "error": "Property ID is required"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Response Fields

### Main Property Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Property UUID |
| `projectName` | string | Name of the project |
| `startingPrice` | number | Starting price |
| `images` | string[] | Array of image URLs |
| `thumbnail` | string | Thumbnail image URL |
| `brochureUrl` | string | PDF brochure URL |
| `paymentPlan` | string | Payment plan details |
| `handover` | string | Expected handover date |
| `expectedAppreciation` | string | Expected appreciation percentage |
| `isActive` | boolean | Whether property is active |
| `createdAt` | string | Creation timestamp (ISO 8601) |
| `updatedAt` | string | Last update timestamp (ISO 8601) |

### Property Type Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Property type UUID |
| `name` | string | Type name (e.g., "Apartment", "Villa") |
| `imageUrl` | string | Type icon/image URL |

### Status Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Status UUID |
| `name` | string | Status name (e.g., "Under Construction", "Ready") |
| `color` | string | Hex color code for UI display |

### Location Object

Contains nested objects for country, state, city, and area:

| Field | Type | Description |
|-------|------|-------------|
| `country` | object | Country details (id, name) |
| `state` | object | State/Emirate details (id, name) |
| `city` | object | City details (id, name) |
| `area` | object | Area/Neighborhood details (id, name) |

### Developer Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Developer UUID |
| `name` | string | Developer name |
| `description` | string | Developer description |
| `imageUrl` | string | Developer main image URL |
| `logoUrl` | string | Developer logo URL |
| `website` | string | Developer website URL |
| `contactEmail` | string | Contact email |
| `contactPhone` | string | Contact phone number |

### Amenities Array

Array of amenity objects:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Amenity UUID |
| `name` | string | Amenity name (e.g., "Swimming Pool") |
| `imageUrl` | string | Amenity icon URL |

---

## Usage Examples

### cURL

```bash
curl -X GET "http://localhost:3000/api/mobile/properties/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript/TypeScript

```typescript
const getPropertyById = async (propertyId: string, token: string) => {
  const response = await fetch(
    `${API_URL}/api/mobile/properties/${propertyId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch property');
  }
  
  const data = await response.json();
  return data.property;
};

// Usage
try {
  const property = await getPropertyById(
    '123e4567-e89b-12d3-a456-426614174000',
    accessToken
  );
  console.log('Property:', property);
} catch (error) {
  console.error('Error:', error);
}
```

### React Native

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PropertyDetailScreen = ({ route }) => {
  const { propertyId } = route.params;
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      
      const response = await fetch(
        `${API_URL}/api/mobile/properties/${propertyId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch property');
      }

      const data = await response.json();
      setProperty(data.property);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <ScrollView>
      <Image source={{ uri: property.thumbnail }} style={styles.thumbnail} />
      <Text style={styles.title}>{property.projectName}</Text>
      <Text style={styles.price}>AED {property.startingPrice.toLocaleString()}</Text>
      <Text>{property.location.area.name}, {property.location.city.name}</Text>
      <Text>{property.developer.name}</Text>
      
      {/* Amenities */}
      <View style={styles.amenities}>
        {property.amenities.map(amenity => (
          <View key={amenity.id} style={styles.amenity}>
            <Image source={{ uri: amenity.imageUrl }} style={styles.amenityIcon} />
            <Text>{amenity.name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default PropertyDetailScreen;
```

### Flutter

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class PropertyService {
  final storage = FlutterSecureStorage();
  final String apiUrl = 'YOUR_API_URL';

  Future<Map<String, dynamic>> getPropertyById(String propertyId) async {
    final token = await storage.read(key: 'access_token');
    
    final response = await http.get(
      Uri.parse('$apiUrl/api/mobile/properties/$propertyId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['property'];
    } else if (response.statusCode == 401) {
      throw Exception('Unauthorized. Please login again.');
    } else if (response.statusCode == 404) {
      throw Exception('Property not found.');
    } else {
      throw Exception('Failed to load property');
    }
  }
}

// Usage in Widget
class PropertyDetailPage extends StatefulWidget {
  final String propertyId;
  
  PropertyDetailPage({required this.propertyId});

  @override
  _PropertyDetailPageState createState() => _PropertyDetailPageState();
}

class _PropertyDetailPageState extends State<PropertyDetailPage> {
  final PropertyService _service = PropertyService();
  Map<String, dynamic>? property;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadProperty();
  }

  Future<void> loadProperty() async {
    try {
      final data = await _service.getPropertyById(widget.propertyId);
      setState(() {
        property = data;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      // Handle error
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      appBar: AppBar(title: Text(property!['projectName'])),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Image.network(property!['thumbnail']),
            Text(property!['projectName'], style: TextStyle(fontSize: 24)),
            Text('AED ${property!['startingPrice']}'),
            // Add more property details
          ],
        ),
      ),
    );
  }
}
```

---

## Integration Flow

### Step 1: Login and Store Token

```typescript
const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/mobile/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  await SecureStore.setItemAsync('access_token', data.access_token);
  return data.access_token;
};
```

### Step 2: Fetch Property Details

```typescript
const token = await SecureStore.getItemAsync('access_token');
const property = await fetch(`${API_URL}/api/mobile/properties/${propertyId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => res.json());
```

### Step 3: Display Property Information

Use the returned property object to display:
- Property images gallery
- Project name and price
- Location details
- Developer information
- Amenities list
- Payment plan
- Expected handover date
- Brochure download link

---

## Common Use Cases

### 1. Property Detail Page

Show complete property information when user taps on a property card.

### 2. Property Comparison

Fetch multiple properties by ID to compare features.

### 3. Favorites/Bookmarks

Store property IDs locally and fetch details when viewing favorites.

### 4. Share Property

Get property details to generate share content with images and basic info.

### 5. Offline Viewing

Cache property details for offline viewing in the app.

---

## Error Handling

```typescript
const fetchProperty = async (propertyId: string) => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    
    const response = await fetch(
      `${API_URL}/api/mobile/properties/${propertyId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (response.status === 401) {
      // Token expired, redirect to login
      await SecureStore.deleteItemAsync('access_token');
      navigation.navigate('Login');
      return null;
    }

    if (response.status === 404) {
      // Property not found
      Alert.alert('Error', 'Property not found');
      navigation.goBack();
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch property');
    }

    const data = await response.json();
    return data.property;
    
  } catch (error) {
    console.error('Error fetching property:', error);
    Alert.alert('Error', 'Failed to load property details');
    return null;
  }
};
```

---

## Performance Tips

### 1. Image Loading

- Use thumbnail for list views
- Lazy load full images in detail view
- Implement image caching

### 2. Caching

```typescript
// Simple cache implementation
const propertyCache = new Map();

const getProperty = async (propertyId: string) => {
  // Check cache first
  if (propertyCache.has(propertyId)) {
    return propertyCache.get(propertyId);
  }
  
  // Fetch from API
  const property = await fetchPropertyFromAPI(propertyId);
  
  // Store in cache
  propertyCache.set(propertyId, property);
  
  return property;
};
```

### 3. Pagination for Images

If property has many images, consider paginating the image gallery.

---

## Security Notes

1. **Token Security**: Always store tokens securely (KeyChain/KeyStore)
2. **HTTPS**: Use HTTPS in production
3. **Token Refresh**: Implement refresh token logic
4. **Validation**: Validate property ID format before making request
5. **Error Messages**: Don't expose sensitive information in errors

---

## Testing

### Test with cURL

```bash
# Get your token first
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.access_token')

# Fetch property
curl -X GET "http://localhost:3000/api/mobile/properties/YOUR_PROPERTY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

### Test Invalid Cases

```bash
# Test without token (should get 401)
curl -X GET "http://localhost:3000/api/mobile/properties/YOUR_PROPERTY_ID"

# Test with invalid property ID (should get 404)
curl -X GET "http://localhost:3000/api/mobile/properties/invalid-id" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Summary

✅ **Endpoint**: `GET /api/mobile/properties/{id}`  
✅ **Auth**: Bearer token required  
✅ **Returns**: Complete property details with all relationships  
✅ **Format**: Camel case, mobile-friendly structure  
✅ **Includes**: Images, location, developer, amenities  

Perfect for building rich property detail screens in your mobile app! 🏢📱

