# Complete Mobile Forgot Password Flow

## Overview

Simple two-API password reset flow for mobile apps. No redirects, no complex URLs - just send email and update password.

---

## Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App UI Flow                       │
└─────────────────────────────────────────────────────────────┘

1. User clicks "Forgot Password"
   ↓
2. User enters email
   ↓
3. App calls: POST /api/mobile/forgot-password
   ↓
4. API sends email (no redirect!)
   ↓
5. User checks email and clicks link
   ↓
6. Deep link opens app with access_token in URL hash
   ↓
7. Mobile developer shows "Enter New Password" screen
   ↓
8. User enters new password
   ↓
9. App calls: POST /api/mobile/reset-password
   ↓
10. Password updated - done!
```

---

## API 1: Request Password Reset

**Endpoint:** `POST /api/mobile/forgot-password`

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent. Please check your email."
}
```

**What happens:**

- ✅ API sends email with reset link
- ✅ No redirect to localhost:3000
- ✅ Mobile developer just waits for API response
- ✅ Then shows "Check your email" message

---

## API 2: Reset Password

**Endpoint:** `POST /api/mobile/reset-password`

**Request:**

```json
{
  "access_token": "token_from_email_url_hash",
  "password": "NewPassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## Mobile Developer Implementation

### Step 1: Show "Forgot Password" Screen

```javascript
function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    const response = await fetch('/api/mobile/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (data.success) {
      // Show success message
      // Tell user to check email
    }
  };

  // ... UI code
}
```

### Step 2: Handle Email Deep Link

Configure deep linking in your app (React Native/Expo):

```json
// app.json
{
  "expo": {
    "scheme": "yourapp",
    "web": {
      "bundler": "metro"
    }
  }
}
```

Listen for the deep link:

```javascript
import * as Linking from 'expo-linking';

// In your app entry point
useEffect(() => {
  const handleUrl = ({ url }) => {
    if (url.includes('updatepassword')) {
      // Extract token from URL hash
      const hash = url.split('#')[1];
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const type = params.get('type');

      if (type === 'recovery' && accessToken) {
        // Navigate to reset password screen
        navigation.navigate('ResetPassword', {
          access_token: accessToken,
        });
      }
    }
  };

  Linking.addEventListener('url', handleUrl);
  Linking.getInitialURL().then(url => url && handleUrl({ url }));

  return () => {
    Linking.removeEventListener('url', handleUrl);
  };
}, []);
```

### Step 3: Show "Reset Password" Screen

```javascript
function ResetPasswordScreen({ route }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const accessToken = route.params.access_token;

  const handleReset = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const response = await fetch('/api/mobile/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        password: password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      Alert.alert('Success', 'Password reset successfully');
      // Navigate to login
      navigation.navigate('Login');
    }
  };

  // ... UI code
}
```

---

## Email Link Format

When user clicks the reset link in email, the URL looks like:

```
https://your-domain.com/updatepassword#access_token=eyJhbGc...&type=recovery
```

Mobile app extracts:

- `access_token` from the hash (`#`) part
- Use this token to authenticate the password reset

---

## Key Points

### ✅ What You Don't Need to Do

- ❌ Don't redirect to localhost:3000
- ❌ Don't show web pages in your app
- ❌ Don't parse complex URLs
- ❌ Don't handle Supabase sessions manually

### ✅ What You Do Need to Do

1. Call `/api/mobile/forgot-password` with email
2. Show success message to user
3. Handle deep link when user clicks email
4. Extract `access_token` from URL hash
5. Show "Enter New Password" screen
6. Call `/api/mobile/reset-password` with token and password
7. Done!

---

## Complete Code Example

```javascript
// ForgotPasswordScreen.js
import { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://your-domain.com/api/mobile/forgot-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();
      Alert.alert('Success', 'Please check your email for reset instructions');
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder='Email'
        value={email}
        onChangeText={setEmail}
        keyboardType='email-address'
      />
      <Button
        title={loading ? 'Sending...' : 'Send Reset Link'}
        onPress={handleForgotPassword}
        disabled={loading}
      />
    </View>
  );
}
```

```javascript
// ResetPasswordScreen.js
import { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';

export function ResetPasswordScreen({ route }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const accessToken = route.params.access_token;

  const handleReset = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const response = await fetch(
        'https://your-domain.com/api/mobile/reset-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            password,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Password reset successfully');
        // Navigate to login
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder='New Password'
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        placeholder='Confirm Password'
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <Button title='Reset Password' onPress={handleReset} />
    </View>
  );
}
```

---

## Testing

1. **Test forgot password:**

   ```bash
   curl -X POST http://localhost:3000/api/mobile/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

2. **Check email** for reset link

3. **Test reset password** (use token from email):
   ```bash
   curl -X POST http://localhost:3000/api/mobile/reset-password \
     -H "Content-Type: application/json" \
     -d '{
       "access_token": "token_from_email",
       "password": "NewPassword123"
     }'
   ```

---

## Summary

**Two APIs, simple flow:**

1. **POST /api/mobile/forgot-password** → Sends email
2. **Extract token from email link** → Mobile app handles
3. **POST /api/mobile/reset-password** → Updates password

**No redirects, no complex flows - just API calls!**
