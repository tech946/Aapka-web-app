# Mobile Reset Password API

## Overview

This API endpoint allows users to reset their password after receiving a password reset email. The mobile app extracts the recovery token from the email link and calls this endpoint to update the password.

## Endpoint

### POST `/api/mobile/reset-password`

Updates the user's password using the recovery token from the password reset email.

**Authentication:** Not required (uses recovery token from email)

---

## Complete Flow

```
1. User forgets password
   ↓
2. Mobile app calls: POST /api/mobile/forgot-password
   ↓
3. User receives email with reset link
   ↓
4. User clicks link in email
   ↓
5. Mobile app catches the deep link and extracts access_token from URL
   ↓
6. Mobile developer shows "Enter New Password" screen
   ↓
7. User enters new password in mobile app
   ↓
8. Mobile app calls: POST /api/mobile/reset-password
   with access_token and new password
   ↓
9. Password updated successfully
```

---

## Request

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "access_token": "token_from_email_url_hash",
  "password": "NewPassword123"
}
```

**Fields:**

| Field          | Type   | Required | Description                             |
| -------------- | ------ | -------- | --------------------------------------- |
| `access_token` | string | Yes      | Recovery token from email link URL hash |
| `password`     | string | Yes      | New password (minimum 6 characters)     |

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Error Responses

#### 400 Bad Request - Missing Access Token

```json
{
  "error": "Access token is required. Please use the token from the password reset email."
}
```

#### 400 Bad Request - Missing Password

```json
{
  "error": "Password is required"
}
```

#### 400 Bad Request - Password Too Short

```json
{
  "error": "Password must be at least 6 characters long"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Failed to update password",
  "details": "error details here"
}
```

---

## Usage Examples

### React Native Example

```javascript
import * as Linking from 'expo-linking';

function ResetPasswordScreen({ route }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract token from deep link
  const accessToken = route.params.access_token; // From email link

  const handleResetPassword = async () => {
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'https://your-domain.com/api/mobile/reset-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: accessToken,
            password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Password reset successfully');
        // Navigate to login screen
        navigation.navigate('Login');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to reset password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Reset Password</Text>

      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

      <TextInput
        placeholder='New Password'
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <TextInput
        placeholder='Confirm Password'
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity onPress={handleResetPassword} disabled={loading}>
        <Text>{loading ? 'Resetting...' : 'Reset Password'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Handling the Deep Link

```javascript
import * as Linking from 'expo-linking';

// In your app initialization or navigation setup
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
  // The URL format from Supabase email is:
  // https://your-domain.com/updatepassword#access_token=xxx&refresh_token=yyy&type=recovery

  // Extract the hash portion
  const hash = url.split('#')[1];
  const params = new URLSearchParams(hash);

  const accessToken = params.get('access_token');
  const type = params.get('type');

  if (type === 'recovery' && accessToken) {
    // Navigate to reset password screen with token
    navigation.navigate('ResetPassword', { access_token: accessToken });
  }
}
```

### cURL Example

```bash
curl -X POST https://your-domain.com/api/mobile/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "password": "NewPassword123"
  }'
```

---

## How It Works

### Recovery Token Extraction

When user clicks the link in email:

1. **Email link format:**

   ```
   https://your-domain.com/updatepassword#access_token=xxx&refresh_token=yyy&type=recovery
   ```

2. **Mobile app extracts:**
   - `access_token` from URL hash
   - Uses it to authenticate the password reset

3. **Password update:**
   - API uses the access_token as temporary authentication
   - No user login required
   - Password is updated in Supabase Auth

---

## Security Notes

- ✅ Recovery token is temporary (expires after set time)
- ✅ Single-use token (invalidated after password update)
- ✅ No login required (token acts as temp auth)
- ✅ Old password is automatically invalidated
- ✅ Secure password storage (hashed by Supabase)

---

## Related Endpoints

- **Request Reset:** `POST /api/mobile/forgot-password` - Send reset email
- **Update Password (Logged In):** `PUT /api/mobile/update-profile` - Update when logged in
- **Login:** `POST /api/auth/mobile/login` - Login after reset

---

## Error Handling

| Error                       | Cause                 | Solution                |
| --------------------------- | --------------------- | ----------------------- |
| "Access token is required"  | Missing token         | Extract from email URL  |
| "Password is required"      | Missing password      | Enter new password      |
| "Password too short"        | Less than 6 chars     | Use longer password     |
| "Failed to update password" | Invalid/expired token | Request new reset email |

---

## Testing

```bash
# Test reset password
curl -X POST http://localhost:3000/api/mobile/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "YOUR_TOKEN_FROM_EMAIL",
    "password": "NewPassword123"
  }'
```

---

## Important Notes

1. **Token Expiry:** Recovery tokens expire after default time (configure in Supabase)
2. **One-Time Use:** Token can only be used once
3. **Email Required:** User must have access to their email
4. **No Login:** Password can be reset without old password
5. **Deep Linking:** App must be configured to handle email links
