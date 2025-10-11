# 🚀 Mobile Home Data - Quick Start Guide

Complete implementation for managing mobile app home page content from the admin dashboard.

---

## 📋 What's Been Created

### ✅ All Required Features Implemented

1. **Video Upload** - Featured video (max 20MB)
2. **Property Selection** - Organize by property types
3. **Tagline Text** - Customizable home page headline
4. **Developer Selection** - Feature partner developers
5. **Story Images** - Up to 10 images for stories section

---

## 🎯 Quick Setup (3 Steps)

### Step 1: Database Setup

```bash
# Copy and run the SQL from this file in your Supabase SQL Editor:
# database/mobile_home_data_table.sql
```

### Step 2: Create Storage Buckets

```bash
node database/setup-mobile-buckets.js
```

### Step 3: Access the Dashboard

1. Navigate to your dashboard at `/dashboard/mobile-home`
2. Start adding content!

---

## 📱 API Endpoints for Mobile App

### Option 1: Basic API (Raw Data)

```
GET /api/mobile-home-data
```

**Response:**

```json
{
  "data": {
    "featured_video_url": "https://...",
    "tagline_text": "Your tagline",
    "properties_by_type": [...],
    "selected_developers": [
      {
        "id": "...",
        "name": "Emaar Properties",
        "description": "...",
        "image_url": "..."
      }
    ],
    "story_images": [...]
  }
}
```

### Option 2: Formatted API (Full Details) ⭐ RECOMMENDED

```
GET /api/mobile-home-data/formatted
```

**Response (Exactly as you requested):**

```json
{
  "data": {
    "featuredVideo": "https://...",
    "taglineText": "Your tagline",
    "properties": {
      "Villa": [
        {
          "id": "...",
          "project_name": "Luxury Beach Villa",
          "starting_price": 2500000,
          "property_types": { "name": "Villa" },
          "property_images": ["..."],
          "developers": { "name": "Emaar" },
          ...full property details
        }
      ],
      "Apartment": [...]
    },
    "selected_developers": [
      {
        "id": "...",
        "name": "Emaar Properties",
        "description": "...",
        "image_url": "...",
        "is_active": true,
        "created_at": "...",
        "updated_at": "..."
      }
    ],
    "stories": ["https://...", "https://..."]
  }
}
```

---

## 💻 Mobile App Integration Example

### React Native

```javascript
import { useEffect, useState } from 'react';

const useHomeData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('YOUR_API_URL/api/mobile-home-data/formatted')
      .then(res => res.json())
      .then(({ data }) => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return { data, loading };
};

// Usage in component
const HomeScreen = () => {
  const { data, loading } = useHomeData();

  if (loading) return <Loader />;

  return (
    <ScrollView>
      {/* Video */}
      <VideoPlayer source={{ uri: data.featuredVideo }} />

      {/* Tagline */}
      <Text>{data.taglineText}</Text>

      {/* Properties by Type */}
      {Object.keys(data.properties).map(typeName => (
        <PropertySection
          key={typeName}
          title={typeName}
          properties={data.properties[typeName]}
        />
      ))}

      {/* Developers */}
      <DeveloperList developers={data.selected_developers} />

      {/* Stories */}
      <Stories images={data.stories} />
    </ScrollView>
  );
};
```

### Flutter

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class HomeDataService {
  static const String baseUrl = 'YOUR_API_URL';

  Future<HomeData> fetchHomeData() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/mobile-home-data/formatted')
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return HomeData.fromJson(json['data']);
    } else {
      throw Exception('Failed to load home data');
    }
  }
}

// Usage in Widget
class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<HomeData> homeData;

  @override
  void initState() {
    super.initState();
    homeData = HomeDataService().fetchHomeData();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<HomeData>(
      future: homeData,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return HomeContent(data: snapshot.data!);
        } else if (snapshot.hasError) {
          return ErrorWidget(snapshot.error);
        }
        return CircularProgressIndicator();
      },
    );
  }
}
```

---

## 🎨 Admin Dashboard Features

### Featured Video

- Drag & drop or click to upload
- Preview current video
- Replace anytime
- Auto-deletion of old videos

### Tagline Text

- 200 character limit
- Character counter
- Real-time preview

### Properties by Type

- Expandable sections for each property type
- Multi-select properties per type
- Shows property count badges
- Property images and prices displayed

### Developers

- Multi-select dropdown
- Search functionality
- Developer logos shown
- Selected count indicator

### Story Images

- Upload up to 10 images
- Visual grid preview
- Delete individually
- Drag & drop support

---

## 📂 File Structure

```
database/
├── mobile_home_data_table.sql          # Database schema
└── setup-mobile-buckets.js              # Bucket creation script

src/
├── app/
│   ├── api/
│   │   └── mobile-home-data/
│   │       ├── route.ts                 # Basic CRUD API
│   │       └── formatted/
│   │           └── route.ts             # Formatted API for mobile
│   └── (dashboard)/
│       └── dashboard/
│           └── mobile-home/
│               └── page.tsx             # Admin dashboard page
└── components/
    └── dashboard/
        └── sidebar.tsx                  # Updated with nav link

docs/
├── MOBILE_HOME_SETUP.md                 # Detailed setup guide
├── MOBILE_HOME_IMPLEMENTATION_SUMMARY.md # Complete implementation details
├── MOBILE_HOME_API_EXAMPLE.json         # Example API response
└── MOBILE_HOME_QUICK_START.md          # This file
```

---

## 🔑 Key Features

### For Admins

✅ Easy-to-use interface  
✅ Drag & drop file uploads  
✅ Real-time validation  
✅ Preview before saving  
✅ One-click updates  
✅ No code deployment needed

### For Developers

✅ RESTful API  
✅ JSON responses  
✅ Full property details  
✅ Developer information  
✅ Public URLs for media  
✅ Well-documented

### For Mobile Apps

✅ Fast API responses  
✅ Structured data  
✅ CDN-hosted media  
✅ Real-time updates  
✅ Minimal bandwidth  
✅ Easy integration

---

## 🎯 Data Flow

```
Admin Dashboard
    ↓
  Uploads Content (Video, Images, Text)
    ↓
  Saves to Supabase
    ↓
  Mobile App Calls API
    ↓
  Receives Formatted Data
    ↓
  Displays on Home Screen
```

---

## 🔒 Security

- ✅ Row Level Security (RLS) enabled
- ✅ Authentication required for admin operations
- ✅ Public read access for mobile apps
- ✅ File type validation (server-side)
- ✅ File size limits enforced
- ✅ Automatic file cleanup

---

## 📊 Storage Buckets

### `videos`

- **Purpose:** Featured home page videos
- **Max Size:** 20MB per file
- **Formats:** MP4, MOV, AVI, WebM
- **Access:** Public

### `mobile-stories`

- **Purpose:** Story images
- **Max Size:** 5MB per file
- **Formats:** JPG, PNG, WebP, GIF
- **Max Count:** 10 images
- **Access:** Public

---

## 🎉 Success Checklist

Before going live, verify:

- [ ] Database table `mobile_home_data` exists
- [ ] Storage bucket `videos` is created
- [ ] Storage bucket `mobile-stories` is created
- [ ] Can access `/dashboard/mobile-home` page
- [ ] Can upload a video successfully
- [ ] Can select properties by type
- [ ] Can select developers
- [ ] Can upload story images
- [ ] API endpoint returns data correctly
- [ ] Mobile app can fetch and display data

---

## 🆘 Troubleshooting

### Issue: "Failed to upload video"

**Solution:** Check video is under 20MB and in MP4/MOV/AVI/WebM format

### Issue: "Bucket not found"

**Solution:** Run `node database/setup-mobile-buckets.js`

### Issue: "Table doesn't exist"

**Solution:** Run the SQL from `database/mobile_home_data_table.sql`

### Issue: "Unauthorized"

**Solution:** Verify your `.env.local` has valid Supabase credentials

### Issue: "Cannot access /dashboard/mobile-home"

**Solution:** Make sure you're logged in to the dashboard

---

## 📞 Need Help?

1. Check `MOBILE_HOME_SETUP.md` for detailed documentation
2. Review `MOBILE_HOME_IMPLEMENTATION_SUMMARY.md` for technical details
3. See `MOBILE_HOME_API_EXAMPLE.json` for API response format

---

## 🎊 You're All Set!

The module is complete and ready to use. Simply follow the 3-step setup above and start managing your mobile app's home page content!

**Happy building! 🚀**
