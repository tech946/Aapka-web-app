# Mobile API - Complete Guide

## Overview

This document provides a complete overview of all mobile API endpoints with Bearer token authentication.

---

## 📱 Available Endpoints

### 🔐 Authentication

#### 1. Login

- **Endpoint**: `POST /api/auth/mobile/login`
- **Auth**: None (public)
- **Purpose**: Get access token for authenticated requests

---

### 👥 Leads Management

#### 2. Add Lead

- **Endpoint**: `POST /api/mobile/leads/add`
- **Auth**: Bearer token required
- **Purpose**: Create a new lead

#### 3. Get Leads

- **Endpoint**: `GET /api/mobile/leads`
- **Auth**: Bearer token required
- **Purpose**: Get all leads for authenticated user
- **Features**: Pagination, search, filter by status

---

### 🏢 Properties

#### 4. Get Property by ID

- **Endpoint**: `GET /api/mobile/properties/{id}`
- **Auth**: Bearer token required
- **Purpose**: Get complete property details

---

## Quick Start

### Step 1: Login

```bash
POST /api/auth/mobile/login

Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGc...",
  "refresh_token": "...",
  "expires_in": 3600
}
```

### Step 2: Use the Token

For all subsequent requests, include the token:

```
Authorization: Bearer eyJhbGc...
```

---

## API Reference

### 1. Login

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response:**

```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "...",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

---

### 2. Add Lead

**Request:**

```bash
curl -X POST http://localhost:3000/api/mobile/leads/add \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "John Doe",
    "mobile_no": "+1234567890",
    "email": "john@example.com",
    "relationship": "Friend",
    "budget": 500000,
    "purpose_of_buying": "Investment",
    "buying_timeline": "3-6 months",
    "notes": "Optional notes"
  }'
```

**Required Fields:**

- ✅ fullname (string)
- ✅ mobile_no (string)
- ✅ email (string - valid format)
- ✅ relationship (string)
- ✅ budget (number)
- ✅ purpose_of_buying (string)
- ✅ buying_timeline (string)
- ❌ notes (string - optional)

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
    ...
  }
}
```

---

### 3. Get Leads

**Request:**

```bash
curl -X GET "http://localhost:3000/api/mobile/leads?page=1&limit=10&status=new&search=john" \
  -H "Authorization: Bearer TOKEN"
```

**Query Parameters:**

- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `status` (optional): new, contacted, qualified, converted, lost
- `search` (optional): Search in name, email, phone

**Response:**

```json
{
  "success": true,
  "leads": [
    {
      "id": "uuid",
      "fullname": "John Doe",
      "mobile_no": "+1234567890",
      "email": "john@example.com",
      "status": "new",
      "budget": 500000,
      "created_at": "2025-10-11T10:30:00Z",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### 4. Get Property by ID

**Request:**

```bash
curl -X GET "http://localhost:3000/api/mobile/properties/PROPERTY_UUID" \
  -H "Authorization: Bearer TOKEN"
```

**Response:**

```json
{
  "success": true,
  "property": {
    "id": "uuid",
    "projectName": "Luxury Residences",
    "startingPrice": 1500000,
    "images": ["url1", "url2"],
    "thumbnail": "url",
    "brochureUrl": "pdf-url",
    "paymentPlan": "20/80",
    "handover": "Q4 2025",
    "expectedAppreciation": "15-20%",
    "propertyType": {
      "id": "uuid",
      "name": "Apartment",
      "imageUrl": "icon-url"
    },
    "status": {
      "id": "uuid",
      "name": "Under Construction",
      "color": "#FFA500"
    },
    "location": {
      "country": { "id": "uuid", "name": "UAE" },
      "state": { "id": "uuid", "name": "Dubai" },
      "city": { "id": "uuid", "name": "Dubai" },
      "area": { "id": "uuid", "name": "Dubai Marina" }
    },
    "developer": {
      "id": "uuid",
      "name": "Emaar Properties",
      "description": "...",
      "imageUrl": "url",
      "website": "https://...",
      "contactEmail": "email",
      "contactPhone": "phone"
    },
    "amenities": [{ "id": "uuid", "name": "Pool", "imageUrl": "url" }]
  }
}
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

#### 401 Token Expired

```json
{
  "error": "Invalid or expired access token. Please login again."
}
```

**Solution**: Login again to get new token

#### 400 Bad Request

```json
{
  "error": "Missing required fields. Required: ..."
}
```

**Solution**: Include all required fields

#### 404 Not Found

```json
{
  "error": "Property not found"
}
```

**Solution**: Check that the resource ID is correct

---

## JavaScript/TypeScript Integration

### Setup API Client

```typescript
// api-client.ts
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://localhost:3000';

class MobileAPIClient {
  private async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('access_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, redirect to login
      await SecureStore.deleteItemAsync('access_token');
      // Navigate to login screen
      throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request('/api/auth/mobile/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    await SecureStore.setItemAsync('access_token', data.access_token);
    return data;
  }

  // Leads
  async addLead(leadData: any) {
    return this.request('/api/mobile/leads/add', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  async getLeads(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    } = {}
  ) {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null) as any
    ).toString();

    return this.request(`/api/mobile/leads?${queryString}`);
  }

  // Properties
  async getPropertyById(propertyId: string) {
    return this.request(`/api/mobile/properties/${propertyId}`);
  }
}

export const api = new MobileAPIClient();
```

### Usage in Components

```typescript
// LoginScreen.tsx
import { api } from './api-client';

const LoginScreen = () => {
  const handleLogin = async () => {
    try {
      const result = await api.login(email, password);
      console.log('Logged in:', result.user);
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

// AddLeadScreen.tsx
const AddLeadScreen = () => {
  const handleSubmit = async () => {
    try {
      const result = await api.addLead({
        fullname,
        mobile_no,
        email,
        relationship,
        budget: parseFloat(budget),
        purpose_of_buying,
        buying_timeline,
        notes,
      });

      Alert.alert('Success', 'Lead added successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Form UI here...
};

// LeadsListScreen.tsx
const LeadsListScreen = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const result = await api.getLeads({ page: 1, limit: 20 });
      setLeads(result.leads);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // List UI here...
};

// PropertyDetailScreen.tsx
const PropertyDetailScreen = ({ route }) => {
  const { propertyId } = route.params;
  const [property, setProperty] = useState(null);

  useEffect(() => {
    loadProperty();
  }, []);

  const loadProperty = async () => {
    try {
      const result = await api.getPropertyById(propertyId);
      setProperty(result.property);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Detail UI here...
};
```

---

## Flutter Integration

```dart
// api_client.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class MobileAPIClient {
  final String apiUrl = 'http://localhost:3000';
  final storage = FlutterSecureStorage();

  Future<String?> _getToken() async {
    return await storage.read(key: 'access_token');
  }

  Future<Map<String, dynamic>> _request(
    String endpoint,
    String method, {
    Map<String, dynamic>? body,
  }) async {
    final token = await _getToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };

    http.Response response;
    final uri = Uri.parse('$apiUrl$endpoint');

    if (method == 'GET') {
      response = await http.get(uri, headers: headers);
    } else if (method == 'POST') {
      response = await http.post(
        uri,
        headers: headers,
        body: jsonEncode(body),
      );
    } else {
      throw Exception('Unsupported method');
    }

    if (response.statusCode == 401) {
      await storage.delete(key: 'access_token');
      throw Exception('UNAUTHORIZED');
    }

    if (response.statusCode >= 400) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Request failed');
    }

    return jsonDecode(response.body);
  }

  // Auth
  Future<Map<String, dynamic>> login(String email, String password) async {
    final data = await _request(
      '/api/auth/mobile/login',
      'POST',
      body: {'email': email, 'password': password},
    );
    await storage.write(key: 'access_token', value: data['access_token']);
    return data;
  }

  // Leads
  Future<Map<String, dynamic>> addLead(Map<String, dynamic> leadData) async {
    return _request('/api/mobile/leads/add', 'POST', body: leadData);
  }

  Future<Map<String, dynamic>> getLeads({
    int page = 1,
    int limit = 10,
    String? status,
    String? search,
  }) async {
    final params = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
      if (status != null) 'status': status,
      if (search != null) 'search': search,
    };
    final queryString = Uri(queryParameters: params).query;
    return _request('/api/mobile/leads?$queryString', 'GET');
  }

  // Properties
  Future<Map<String, dynamic>> getPropertyById(String propertyId) async {
    return _request('/api/mobile/properties/$propertyId', 'GET');
  }
}

final api = MobileAPIClient();
```

---

## Security Best Practices

### 1. Token Storage

- ✅ Use SecureStore (React Native/Expo)
- ✅ Use KeyChain (iOS native)
- ✅ Use KeyStore (Android native)
- ✅ Use FlutterSecureStorage (Flutter)
- ❌ Never store in AsyncStorage/SharedPreferences
- ❌ Never store in plain text

### 2. Token Management

- ✅ Handle token expiration gracefully
- ✅ Implement token refresh logic
- ✅ Clear token on logout
- ✅ Redirect to login on 401 errors

### 3. HTTPS

- ✅ Always use HTTPS in production
- ✅ Implement certificate pinning for extra security

### 4. Error Handling

- ✅ Don't expose sensitive info in error messages
- ✅ Log errors for debugging (but not sensitive data)
- ✅ Show user-friendly messages

---

## Testing

### Test Script

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"

# 2. Add Lead
curl -X POST http://localhost:3000/api/mobile/leads/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname":"John Doe",
    "mobile_no":"+1234567890",
    "email":"john@example.com",
    "relationship":"Friend",
    "budget":500000,
    "purpose_of_buying":"Investment",
    "buying_timeline":"3-6 months"
  }' | jq '.'

# 3. Get Leads
curl -X GET "http://localhost:3000/api/mobile/leads?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 4. Get Property
curl -X GET "http://localhost:3000/api/mobile/properties/PROPERTY_UUID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## File Structure

```
src/app/api/
├── auth/mobile/
│   ├── login/route.ts
│   ├── logout/route.ts
│   └── signup/route.ts
└── mobile/
    ├── leads/
    │   ├── add/route.ts
    │   └── route.ts
    └── properties/
        └── [id]/route.ts
```

---

## Documentation Files

- **MOBILE_LEADS_API.md** - Complete leads API documentation
- **MOBILE_PROPERTY_API.md** - Complete property API documentation
- **MOBILE_LEADS_QUICK_REFERENCE.md** - Quick reference guide
- **MOBILE_PROPERTY_API_SUMMARY.md** - Property API summary
- **MOBILE_API_COMPLETE_GUIDE.md** - This file (complete guide)

---

## Summary

✅ **4 Main Endpoints**: Login, Add Lead, Get Leads, Get Property  
✅ **Bearer Token Auth**: Secure token-based authentication  
✅ **User Isolation**: Users only see their own leads  
✅ **Complete Data**: Full property details with relationships  
✅ **Mobile Optimized**: Formatted for mobile consumption  
✅ **Well Documented**: Complete docs with examples

Perfect for building a complete mobile real estate application! 🏢📱🚀
