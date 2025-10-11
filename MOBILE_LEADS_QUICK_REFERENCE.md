# Mobile Leads API - Quick Reference Card

## 🔗 Endpoints

### Login

```
POST /api/auth/mobile/login
```

### Add Lead

```
POST /api/mobile/leads/add
Headers: Authorization: Bearer <token>
```

### Get Leads

```
GET /api/mobile/leads?page=1&limit=10&status=new&search=john
Headers: Authorization: Bearer <token>
```

### Get Property by ID

```
GET /api/mobile/properties/{propertyId}
Headers: Authorization: Bearer <token>
```

---

## 📝 Add Lead Request Body

```json
{
  "fullname": "John Doe", // ✅ Required
  "mobile_no": "+1234567890", // ✅ Required
  "email": "john@example.com", // ✅ Required (valid format)
  "relationship": "Friend", // ✅ Required
  "budget": 500000, // ✅ Required (number)
  "purpose_of_buying": "Investment", // ✅ Required
  "buying_timeline": "3-6 months", // ✅ Required
  "notes": "Optional notes" // ❌ Optional
}
```

---

## 🔐 Authentication

### Get Token

```bash
curl -X POST http://localhost:3000/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Response:**

```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "...",
  "expires_in": 3600
}
```

### Use Token

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/mobile/leads
```

---

## 📊 Query Parameters (GET /api/mobile/leads)

| Parameter | Type   | Default | Description                |
| --------- | ------ | ------- | -------------------------- |
| `page`    | number | 1       | Page number                |
| `limit`   | number | 10      | Results per page           |
| `status`  | string | -       | Filter by status           |
| `search`  | string | -       | Search in name/email/phone |

### Status Values

- `new` (default)
- `contacted`
- `qualified`
- `converted`
- `lost`

---

## 🚀 Quick Start Examples

### React Native / Expo

```typescript
// 1. Login
const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/mobile/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const { access_token } = await response.json();
  await SecureStore.setItemAsync('token', access_token);
  return access_token;
};

// 2. Add Lead
const addLead = async (leadData: any) => {
  const token = await SecureStore.getItemAsync('token');
  const response = await fetch(`${API_URL}/api/mobile/leads/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(leadData),
  });
  return response.json();
};

// 3. Get Leads
const getLeads = async (page = 1) => {
  const token = await SecureStore.getItemAsync('token');
  const response = await fetch(
    `${API_URL}/api/mobile/leads?page=${page}&limit=10`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.json();
};
```

### Flutter

```dart
// 1. Login
Future<String> login(String email, String password) async {
  final response = await http.post(
    Uri.parse('$apiUrl/api/auth/mobile/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'email': email, 'password': password}),
  );
  final data = jsonDecode(response.body);
  await storage.write(key: 'token', value: data['access_token']);
  return data['access_token'];
}

// 2. Add Lead
Future<Map<String, dynamic>> addLead(Map<String, dynamic> leadData) async {
  final token = await storage.read(key: 'token');
  final response = await http.post(
    Uri.parse('$apiUrl/api/mobile/leads/add'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode(leadData),
  );
  return jsonDecode(response.body);
}

// 3. Get Leads
Future<Map<String, dynamic>> getLeads(int page) async {
  final token = await storage.read(key: 'token');
  final response = await http.get(
    Uri.parse('$apiUrl/api/mobile/leads?page=$page&limit=10'),
    headers: {'Authorization': 'Bearer $token'},
  );
  return jsonDecode(response.body);
}
```

### Swift (iOS)

```swift
// 1. Login
func login(email: String, password: String) async throws -> String {
    let url = URL(string: "\(apiUrl)/api/auth/mobile/login")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONEncoder().encode([
        "email": email,
        "password": password
    ])

    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(LoginResponse.self, from: data)

    // Save to keychain
    KeychainWrapper.standard.set(response.accessToken, forKey: "token")
    return response.accessToken
}

// 2. Add Lead
func addLead(leadData: LeadData) async throws -> Lead {
    guard let token = KeychainWrapper.standard.string(forKey: "token") else {
        throw AuthError.noToken
    }

    let url = URL(string: "\(apiUrl)/api/mobile/leads/add")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.httpBody = try JSONEncoder().encode(leadData)

    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(AddLeadResponse.self, from: data)
    return response.lead
}
```

---

## ✅ Success Responses

### Add Lead (201)

```json
{
  "success": true,
  "message": "Lead created successfully",
  "lead": {
    /* lead object */
  }
}
```

### Get Leads (200)

```json
{
  "success": true,
  "leads": [
    /* array of leads */
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

## ❌ Error Responses

### 401 Unauthorized

```json
{
  "error": "Unauthorized. Please provide a valid access token."
}
```

### 400 Bad Request

```json
{
  "error": "Missing required fields. Required: fullname, mobile_no, ..."
}
```

### 400 Invalid Email

```json
{
  "error": "Invalid email format"
}
```

---

## 🧪 Test with cURL

### Complete Flow

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.access_token')

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
  }'

# 3. Get Leads
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/mobile/leads?page=1&limit=10"

# 4. Search
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/mobile/leads?search=john"

# 5. Filter by status
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/mobile/leads?status=new"
```

---

## 📁 File Locations

```
src/app/api/
├── auth/mobile/login/route.ts       # Login endpoint
├── mobile/
│   └── leads/
│       ├── route.ts                 # GET leads
│       └── add/route.ts             # POST add lead
└── leads/route.ts                   # Web dashboard (admin)
```

---

## 🔒 Security Checklist

- ✅ Always use Bearer token in Authorization header
- ✅ Store tokens securely (KeyChain/KeyStore/SecureStore)
- ✅ Handle token expiration gracefully
- ✅ Use HTTPS in production
- ✅ Validate all input on client side too
- ✅ Don't log tokens or sensitive data
- ✅ Implement token refresh logic

---

## 📚 Additional Resources

- **Full Documentation**: `MOBILE_LEADS_API.md`
- **Implementation Details**: `MOBILE_LEADS_IMPLEMENTATION_SUMMARY.md`
- **Test Script**: `test-mobile-leads-api.js`

---

## 🆘 Quick Troubleshooting

| Issue              | Solution                                           |
| ------------------ | -------------------------------------------------- |
| 401 Unauthorized   | Check if token is included in Authorization header |
| Token expired      | Re-login to get new token                          |
| 400 Missing fields | Ensure all required fields are in request body     |
| 400 Invalid email  | Check email format is valid                        |
| Network error      | Check server is running and URL is correct         |
| Empty leads list   | Add a lead first or check user has created leads   |

---

## 🎯 Key Differences: Web vs Mobile

| Feature | Web (`/api/leads`) | Mobile (`/api/mobile/leads`) |
| ------- | ------------------ | ---------------------------- |
| Auth    | Cookie (session)   | Bearer token                 |
| Data    | All leads (admin)  | Only own leads               |
| Add     | POST /api/leads    | POST /api/mobile/leads/add   |
| Get     | GET /api/leads     | GET /api/mobile/leads        |

---

**Need help?** Check the full documentation or run the test script!

```bash
node test-mobile-leads-api.js
```
