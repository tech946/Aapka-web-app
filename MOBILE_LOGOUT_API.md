# Mobile Logout API Documentation

## Overview

This API endpoint allows mobile applications to log out authenticated users. Since this application uses stateless JWT tokens, logout is primarily a client-side action where the token is removed from secure storage.

## Endpoint

### POST `/api/auth/mobile/logout`

Logs out the authenticated user and provides instructions for client-side token deletion.

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

**Method:** `POST`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body:** None

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Successfully logged out",
  "user_id": "uuid-of-logged-out-user",
  "logout_instructions": "Please delete the token from secure storage on the client"
}
```

### Error Responses

#### 401 Unauthorized - Missing Token

```json
{
  "error": "Unauthorized. Please provide a valid access token.",
  "success": false
}
```

#### 401 Unauthorized - Invalid Token

```json
{
  "error": "Invalid or expired access token",
  "success": false
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "success": false
}
```

---

## Usage Examples

### JavaScript/TypeScript (React Native)

```javascript
async function logout(accessToken) {
  try {
    // Call logout endpoint
    const response = await fetch(
      'https://your-domain.com/api/auth/mobile/logout',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      // Delete token from secure storage (IMPORTANT!)
      // For React Native, you might use AsyncStorage or Expo SecureStore:
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');

      // Navigate to login screen
      navigation.navigate('Login');

      console.log('Logged out successfully');
      return { success: true };
    } else {
      console.error('Logout failed:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}
```

### Complete Logout Flow Example

```javascript
async function handleLogout() {
  try {
    const accessToken = await SecureStore.getItemAsync('access_token');

    if (!accessToken) {
      // Already logged out, just clear local storage
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      navigation.navigate('Login');
      return;
    }

    // Call logout API
    const response = await fetch(
      'https://your-domain.com/api/auth/mobile/logout',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Always clear tokens from storage, even if API call fails
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');

    // Clear any other local storage items
    AsyncStorage.clear();

    // Navigate to login
    navigation.navigate('Login');
  } catch (error) {
    console.error('Error during logout:', error);
    // Even if logout fails, clear tokens and navigate to login
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    navigation.navigate('Login');
  }
}
```

### cURL

```bash
curl -X POST https://your-domain.com/api/auth/mobile/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### Postman

1. **Method:** `POST`
2. **URL:** `https://your-domain.com/api/auth/mobile/logout`
3. **Headers:**
   - `Authorization`: `Bearer YOUR_ACCESS_TOKEN`
   - `Content-Type`: `application/json`

---

## Important Notes

### Client-Side Token Deletion

Since JWT tokens are stateless, **the client must delete the token from secure storage** after logout:

#### React Native

```javascript
import * as SecureStore from 'expo-secure-store';

// Delete tokens
await SecureStore.deleteItemAsync('access_token');
await SecureStore.deleteItemAsync('refresh_token');
```

#### Flutter

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

// Delete tokens
await storage.delete(key: 'access_token');
await storage.delete(key: 'refresh_token');
```

#### Native iOS (Swift)

```swift
import Security

// Delete from Keychain
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrAccount as String: "access_token"
]
SecItemDelete(query as CFDictionary)
```

#### Native Android (Java/Kotlin)

```kotlin
// Delete from SharedPreferences or Keystore
val sharedPref = getSharedPreferences("AuthPrefs", Context.MODE_PRIVATE)
sharedPref.edit().remove("access_token").remove("refresh_token").apply()
```

---

## Security Considerations

### Why Client-Side Deletion is Critical

1. **Stateless Tokens:** JWT tokens cannot be invalidated on the server without additional infrastructure
2. **Client Control:** The client must ensure tokens are removed from memory and storage
3. **Session Security:** Without token deletion, the user remains "logged in" until token expiration

### Best Practices

1. **Always Delete Tokens:** Even if the logout API call fails, always delete tokens from secure storage
2. **Use Secure Storage:** Use encrypted secure storage for tokens (not AsyncStorage or UserDefaults)
3. **Clear All Auth Data:** Remove all authentication-related data from local storage
4. **Clear Navigation State:** Reset navigation to login screen after logout
5. **Handle Network Errors:** Logout should work even if network is unavailable

---

## Logout Flow Diagram

```
User Clicks Logout
       ↓
Call POST /api/auth/mobile/logout with Bearer token
       ↓
Receive success response
       ↓
Delete access_token from secure storage
       ↓
Delete refresh_token from secure storage
       ↓
Clear all local storage
       ↓
Navigate to Login screen
       ↓
Done
```

---

## Error Handling

### Network Error

If the logout API call fails due to network issues:

```javascript
try {
  await logout(accessToken);
} catch (error) {
  // Still clear tokens even if API call failed
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
  navigation.navigate('Login');
}
```

### Invalid Token Error

If the token is already invalid or expired:

```javascript
// This is okay - just clear tokens and log out
await SecureStore.deleteItemAsync('access_token');
await SecureStore.deleteItemAsync('refresh_token');
navigation.navigate('Login');
```

---

## Integration with Other APIs

### Related Endpoints

1. **Login:** `POST /api/auth/mobile/login`
   - Get the access token for authentication

2. **Mobile Home Data:** `GET /api/mobile-home-data/formatted`
   - Example of a protected endpoint

3. **Mobile User Details:** `GET /api/mobile/user-details`
   - Get authenticated user information

---

## Testing

Use the provided test script to test the API:

```bash
node test-mobile-logout-api.js
```

**Before running:**

1. Update `ACCESS_TOKEN` in the test file with a valid token
2. Get a token by logging in: `POST /api/auth/mobile/login`

---

## Security

- ✅ **Authentication Required:** Valid token must be provided
- ✅ **Token Verification:** Token is verified before logout confirmation
- ✅ **Client-Side Security:** Token deletion happens on client (critical)
- ✅ **Stateless Design:** No server-side session management needed

---

## Support

For issues or questions:

1. Check the error response for specific error messages
2. Verify your access token is valid
3. Ensure tokens are deleted from secure storage after logout
4. Contact support if issues persist

---

## Complete Logout Implementation Checklist

- [ ] Call logout API endpoint
- [ ] Delete `access_token` from secure storage
- [ ] Delete `refresh_token` from secure storage
- [ ] Clear any local caching of user data
- [ ] Clear navigation state
- [ ] Navigate to login screen
- [ ] Handle network errors gracefully
- [ ] Ensure logout works offline (clear tokens anyway)
