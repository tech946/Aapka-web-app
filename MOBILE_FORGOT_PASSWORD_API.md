# Mobile Forgot Password API

## Overview

The Mobile Forgot Password API allows users to request a password reset email when they've forgotten their password. This is a critical security feature that enables users to regain access to their accounts without requiring them to log in first.

## Key Features

- ✅ No authentication required (designed for users who can't log in)
- ✅ Email validation and security best practices
- ✅ Uses Supabase's built-in password reset functionality
- ✅ Returns generic messages to prevent email enumeration
- ✅ Mobile-friendly implementation

---

## Endpoints

### POST `/api/mobile/forgot-password`

Sends a password reset email to the user. **No redirect happens** - the email contains a link with a recovery token that the mobile app will extract to show the reset screen.

**Authentication:** Not required

**Method:** `POST`

---

## Request

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "email": "user@example.com"
}
```

**Fields:**

| Field   | Type   | Required | Description                   |
| ------- | ------ | -------- | ----------------------------- |
| `email` | string | Yes      | User's email address to reset |

---

## Response

### Success Response (200 OK)

Always returns success for security (doesn't reveal if email exists):

```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent. Please check your email."
}
```

### Error Responses

#### 400 Bad Request - Missing Email

```json
{
  "error": "Email is required"
}
```

#### 400 Bad Request - Invalid Email Format

```json
{
  "error": "Invalid email format"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## How Password Reset Works in Supabase

### Standard Flow

1. User requests password reset via API
2. Supabase sends an email with a recovery link
3. User clicks the link in their email
4. Link redirects to a page (configured in `redirectTo`)
5. User enters new password
6. Password is updated without requiring login

### For Mobile Apps

For mobile applications, the flow is:

1. **User requests reset**: Call `/api/mobile/forgot-password`
2. **Receive email**: User gets email with reset link
3. **Click link**: Link opens the app (via deep linking) or web page
4. **Reset in app**: User enters new password in the app
5. **Complete reset**: Password updated successfully

---

## Usage Examples

### JavaScript/TypeScript (React Native)

#### Basic Request

```javascript
async function requestPasswordReset(email) {
  const response = await fetch(
    'https://your-domain.com/api/mobile/forgot-password',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
      }),
    }
  );

  const data = await response.json();
  return data;
}
```

#### Complete React Native Example with UI

```javascript
import { useState } from 'react';
import { Alert, TextInput, TouchableOpacity, Text, View } from 'react-native';

function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleForgotPassword = async () => {
    // Validate email
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        'https://your-domain.com/api/mobile/forgot-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        Alert.alert(
          'Check Your Email',
          'If an account exists with this email, a password reset link has been sent.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Forgot Password?</Text>

      {message ? (
        <Text style={{ color: 'green', marginBottom: 10 }}>{message}</Text>
      ) : null}

      <TextInput
        placeholder='Enter your email'
        value={email}
        onChangeText={setEmail}
        keyboardType='email-address'
        autoCapitalize='none'
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 20,
        }}
      />

      <TouchableOpacity
        onPress={handleForgotPassword}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 5,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

### cURL

```bash
curl -X POST https://your-domain.com/api/mobile/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### Python

```python
import requests

def request_password_reset(email):
    url = "https://your-domain.com/api/mobile/forgot-password"

    response = requests.post(
        url,
        json={"email": email},
        headers={"Content-Type": "application/json"}
    )

    return response.json()

# Usage
result = request_password_reset("user@example.com")
print(result)
```

### Node.js

```javascript
const axios = require('axios');

async function requestPasswordReset(email) {
  try {
    const response = await axios.post(
      'https://your-domain.com/api/mobile/forgot-password',
      { email },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
requestPasswordReset('user@example.com')
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

---

## Security Considerations

### Email Enumeration Prevention

The API always returns the same success message whether or not the email exists. This prevents attackers from discovering which emails are registered in your system.

### Why This Approach?

```
✓ Security: Doesn't reveal if email exists
✓ Privacy: Protects user data
✓ Best Practice: Prevents email enumeration attacks
```

### Supabase Email Settings

Ensure your Supabase project is configured to send password reset emails:

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Configure the **Reset Password** email template
4. Set your SMTP settings (if not using default)

---

## Testing

### Using the Test File

A test file is included at the root: `test-mobile-forgot-password-api.js`

Run it with:

```bash
node test-mobile-forgot-password-api.js
```

### Manual Testing

```bash
# Test with valid email
curl -X POST http://localhost:3000/api/mobile/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test with missing email
curl -X POST http://localhost:3000/api/mobile/forgot-password \
  -H "Content-Type: application/json" \
  -d '{}'

# Test with invalid email format
curl -X POST http://localhost:3000/api/mobile/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "notanemail"}'
```

---

## Deep Linking Setup (Mobile Apps)

For mobile apps to handle password reset links, you need to configure deep linking.

### Configuration Example

#### Android (app.json for Expo)

```json
{
  "expo": {
    "scheme": "yourapp",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "yourapp",
              "host": "reset-password"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

#### iOS (Info.plist)

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>yourapp</string>
    </array>
  </dict>
</array>
```

### Environment Variable

Update your `.env.local` or production environment:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Or for local development:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Complete Password Reset Flow

### Step-by-Step Flow

```
1. User forgets password
   ↓
2. User enters email in app
   ↓
3. App calls POST /api/mobile/forgot-password
   ↓
4. API sends reset email via Supabase
   ↓
5. User receives email with reset link
   ↓
6. User clicks link (deep link to app or web page)
   ↓
7. App opens "Enter New Password" screen
   ↓
8. User enters new password
   ↓
9. App calls password reset endpoint
   ↓
10. Password updated successfully
```

### Handling the Reset Link in Your App

```javascript
import * as Linking from 'expo-linking';

// Handle deep links
useEffect(() => {
  // Handle initial URL if app was opened via deep link
  Linking.getInitialURL().then(url => {
    if (url) handlePasswordResetLink(url);
  });

  // Handle URLs while app is running
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handlePasswordResetLink(url);
  });

  return () => subscription.remove();
}, []);

function handlePasswordResetLink(url) {
  // Extract token from URL
  // Format: yourapp://reset-password?token=xxx&type=recovery
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const token = urlParams.get('token');
  const type = urlParams.get('type');

  if (type === 'recovery' && token) {
    // Navigate to reset password screen with token
    navigation.navigate('ResetPassword', { token });
  }
}
```

---

## Related Endpoints

1. **Update Password (Logged In):** `PUT /api/mobile/update-profile`
   - Update password when user is logged in
   - Requires current password verification

2. **Login:** `POST /api/auth/mobile/login`
   - Login after password reset

3. **Get Profile:** `GET /api/mobile/update-profile`
   - Get user profile (requires authentication)

---

## Common Issues and Solutions

### Issue: Email Not Received

**Possible Causes:**

- Email went to spam folder
- Email address not registered
- SMTP not configured in Supabase

**Solutions:**

- Check spam/junk folder
- Verify email in Supabase dashboard
- Configure SMTP settings

### Issue: Reset Link Expired

**Cause:** Supabase reset tokens expire after a set time (default: 1 hour)

**Solution:** Request a new reset link

### Issue: Deep Link Not Working

**Possible Causes:**

- Deep link not configured in app
- Wrong URL scheme
- App not handling URL parameters

**Solutions:**

- Check app.json / Info.plist configuration
- Verify URL scheme matches
- Test deep linking with expo-linking or react-native-linking

---

## Environment Variables

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site URL (for redirects)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## Response Codes

| Status Code | Description                              |
| ----------- | ---------------------------------------- |
| 200         | Success (always returns success message) |
| 400         | Bad request (missing/invalid email)      |
| 500         | Internal server error                    |

---

## Notes

- The API uses Supabase's `resetPasswordForEmail()` method
- No authentication is required to call this endpoint
- The reset link is sent via email automatically by Supabase
- Users can only reset passwords if they registered with email/password (not OAuth)
- The email template can be customized in Supabase dashboard
- Reset links expire (default: 1 hour, configurable in Supabase)

---

## Support

For issues or questions:

1. Check Supabase email templates configuration
2. Verify SMTP settings are working
3. Test email delivery in Supabase dashboard
4. Check spam folder for reset emails
5. Review deep linking configuration for mobile apps
