# Mobile API Access Guide

This document explains how mobile applications should authenticate and access the formatted mobile home data API.

## Authentication Flow

### 1. Mobile Login

**Endpoint:** `POST /api/auth/mobile/login`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response (Success):**

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
  }
}
```

### 2. Mobile Signup

**Endpoint:** `POST /api/auth/mobile/signup`

**Request:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "userData": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "avatarUrl": "https://..."
  }
}
```

**Response (Success):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "v1.MRjHF8c4...",
  "expires_in": 3600,
  "expires_at": 1234567890,
  "user": {
    "id": "user-uuid",
    "email": "newuser@example.com",
    ...
  },
  "requiresEmailConfirmation": false
}
```

## Accessing Protected APIs

### Mobile Home Data (Formatted)

**Endpoint:** `GET /api/mobile-home-data/formatted`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (Success):**

```json
{
  "data": {
    "featuredVideo": "https://...",
    "taglineText": "Find Your Dream Property",
    "properties": {
      "Apartment": [
        {
          "id": "uuid",
          "project_name": "Luxury Apartments",
          "starting_price": 500000,
          "property_images": ["url1", "url2"],
          "property_types": {
            "name": "Apartment",
            "image_url": "..."
          },
          "developers": {
            "name": "Premium Developers",
            "description": "...",
            "image_url": "..."
          },
          ...
        }
      ],
      "Villa": [...]
    },
    "developers": [
      {
        "id": "uuid",
        "name": "Premium Developers",
        "description": "Leading real estate developers",
        "image_url": "https://..."
      }
    ],
    "stories": [
      "https://story1.jpg",
      "https://story2.jpg"
    ]
  }
}
```

**Response (Error - No Token):**

```json
{
  "error": "Unauthorized. Please provide a valid access token."
}
```

Status: 401

**Response (Error - Invalid Token):**

```json
{
  "error": "Invalid or expired access token. Please login again."
}
```

Status: 401

## Mobile App Implementation Example

### React Native Example

```javascript
// 1. Login and store token
const login = async (email, password) => {
  const response = await fetch(
    'https://your-domain.com/api/auth/mobile/login',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    }
  );

  const data = await response.json();

  if (response.ok) {
    // Store the access token securely (use SecureStore or AsyncStorage)
    await SecureStore.setItemAsync('access_token', data.access_token);
    await SecureStore.setItemAsync('refresh_token', data.refresh_token);
    return data;
  } else {
    throw new Error(data.error);
  }
};

// 2. Fetch mobile home data using the token
const fetchHomeData = async () => {
  const token = await SecureStore.getItemAsync('access_token');

  if (!token) {
    throw new Error('No access token found. Please login.');
  }

  const response = await fetch(
    'https://your-domain.com/api/mobile-home-data/formatted',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (response.ok) {
    return data.data;
  } else {
    // If 401, token expired - need to refresh or re-login
    if (response.status === 401) {
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(data.error);
  }
};

// 3. Usage in component
const HomeScreen = () => {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchHomeData();
        setHomeData(data);
      } catch (error) {
        console.error('Error loading home data:', error);
        // Handle error - maybe redirect to login
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <ActivityIndicator />;

  return (
    <ScrollView>
      {/* Display featured video */}
      {homeData.featuredVideo && (
        <Video source={{ uri: homeData.featuredVideo }} />
      )}

      {/* Display tagline */}
      <Text>{homeData.taglineText}</Text>

      {/* Display properties by type */}
      {Object.entries(homeData.properties).map(([type, properties]) => (
        <View key={type}>
          <Text>{type}</Text>
          {properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </View>
      ))}

      {/* Display developers */}
      {homeData.developers.map(developer => (
        <DeveloperCard key={developer.id} developer={developer} />
      ))}

      {/* Display stories */}
      <Stories images={homeData.stories} />
    </ScrollView>
  );
};
```

### Flutter Example

```dart
// 1. Login Service
class AuthService {
  final String baseUrl = 'https://your-domain.com';

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/mobile/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      // Store tokens securely using flutter_secure_storage
      final storage = FlutterSecureStorage();
      await storage.write(key: 'access_token', value: data['access_token']);
      await storage.write(key: 'refresh_token', value: data['refresh_token']);
      return data;
    } else {
      throw Exception(jsonDecode(response.body)['error']);
    }
  }
}

// 2. Home Data Service
class HomeDataService {
  final String baseUrl = 'https://your-domain.com';

  Future<Map<String, dynamic>> fetchHomeData() async {
    final storage = FlutterSecureStorage();
    final token = await storage.read(key: 'access_token');

    if (token == null) {
      throw Exception('No access token found. Please login.');
    }

    final response = await http.get(
      Uri.parse('$baseUrl/api/mobile-home-data/formatted'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body)['data'];
    } else if (response.statusCode == 401) {
      throw Exception('Session expired. Please login again.');
    } else {
      throw Exception(jsonDecode(response.body)['error']);
    }
  }
}

// 3. Usage in Widget
class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? homeData;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadHomeData();
  }

  Future<void> loadHomeData() async {
    try {
      final service = HomeDataService();
      final data = await service.fetchHomeData();
      setState(() {
        homeData = data;
        isLoading = false;
      });
    } catch (e) {
      print('Error loading home data: $e');
      // Handle error - maybe navigate to login
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    return ListView(
      children: [
        // Featured video
        if (homeData?['featuredVideo'] != null)
          VideoPlayer(url: homeData!['featuredVideo']),

        // Tagline
        Text(homeData?['taglineText'] ?? ''),

        // Properties by type
        ...buildPropertiesByType(),

        // Developers
        ...buildDevelopers(),

        // Stories
        StoriesWidget(images: homeData?['stories'] ?? []),
      ],
    );
  }

  List<Widget> buildPropertiesByType() {
    // Implementation
  }

  List<Widget> buildDevelopers() {
    // Implementation
  }
}
```

## Token Refresh

When the access token expires (typically after 1 hour), the mobile app should:

1. Use the `refresh_token` to get a new `access_token`
2. Or prompt the user to login again

## Security Best Practices

1. **Store tokens securely:**
   - React Native: Use `expo-secure-store` or `react-native-keychain`
   - Flutter: Use `flutter_secure_storage`

2. **Always use HTTPS** in production

3. **Handle token expiration gracefully:**
   - Implement automatic token refresh
   - Redirect to login when token is invalid

4. **Never log tokens** in production builds

5. **Clear tokens on logout**

## Testing the API

You can test the mobile API using cURL or Postman:

```bash
# 1. Login
curl -X POST https://your-domain.com/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 2. Use the token to access formatted data
curl -X GET https://your-domain.com/api/mobile-home-data/formatted \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Troubleshooting

### Error: "Unauthorized. Please provide a valid access token."

- Make sure you're sending the Authorization header
- Verify the header format: `Bearer <token>`

### Error: "Invalid or expired access token. Please login again."

- The token has expired or is invalid
- Request a new token by logging in again
- Implement token refresh logic

### Error: "User profile not found. Please contact support."

- The user exists in auth but not in the profiles table
- Contact support to fix the database

## Summary

The mobile app authentication flow:

1. User logs in → receives `access_token`
2. Store `access_token` securely
3. Include `Authorization: Bearer <access_token>` header in all protected API requests
4. Handle token expiration by refreshing or re-authenticating
