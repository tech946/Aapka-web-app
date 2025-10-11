# Mobile Home Page Data Management - Setup Guide

This module allows admins to manage the content displayed on the mobile app's home page through the dashboard.

## Features

The mobile home page data management includes:

1. **Featured Video** - Upload a video (max 20MB) to display on the home page
2. **Tagline Text** - Set a catchy tagline for the mobile app home page
3. **Properties by Type** - Select which properties to feature for each property type
4. **Featured Developers** - Choose which developers to showcase
5. **Story Images** - Upload up to 10 images for stories section

## Setup Instructions

### 1. Database Setup

Run the SQL script to create the required table:

```bash
# Execute the SQL file in your Supabase SQL editor
# File: database/mobile_home_data_table.sql
```

Or manually execute:

```sql
-- Copy and paste the contents from database/mobile_home_data_table.sql
```

### 2. Storage Buckets Setup

Create the required storage buckets by running:

```bash
node database/setup-mobile-buckets.js
```

This will create two buckets:

- **videos** - For featured videos (max 20MB)
- **mobile-stories** - For story images (max 5MB each)

### 3. Verify Setup

After running the scripts, verify in your Supabase dashboard:

**Tables:**

- `mobile_home_data` should exist with columns:
  - `id` (UUID)
  - `featured_video_url` (TEXT)
  - `tagline_text` (TEXT)
  - `properties_by_type` (JSONB)
  - `selected_developers` (JSONB)
  - `story_images` (JSONB)
  - `is_active` (BOOLEAN)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

**Storage Buckets:**

- `videos` bucket (public, 20MB limit)
- `mobile-stories` bucket (public, 5MB limit)

## Usage

### Accessing the Module

1. Log in to the dashboard
2. Navigate to **Mobile Home** from the sidebar
3. You'll see the mobile home data management page

### Managing Content

#### 1. Featured Video

- Click "Upload Video" to select a video file
- Supported formats: MP4, MOV, AVI, WebM
- Maximum size: 20MB
- Only one video can be active at a time

#### 2. Tagline Text

- Enter a catchy tagline (max 200 characters)
- This will be displayed prominently on the home page

#### 3. Properties by Type

- Expand any property type accordion
- Select multiple properties to feature for that type
- Selected properties will be shown in the mobile app home page

#### 4. Featured Developers

- Use the multi-select dropdown
- Choose developers to showcase on the home page
- Selected developers will appear with their images and details

#### 5. Story Images

- Click "Select Story Images" to upload images
- Maximum 10 images allowed
- Each image max 5MB
- Supported formats: JPG, PNG, WebP, GIF
- Images can be removed by clicking the delete button

### Saving Changes

- Click the "Save Changes" button at the bottom
- All changes are saved together
- A success message will confirm the save

## API Endpoints

### GET /api/mobile-home-data

Returns the current active mobile home page data.

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "featured_video_url": "https://...",
    "tagline_text": "Your tagline here",
    "properties_by_type": [
      {
        "property_type_id": 1,
        "property_type_name": "Villa",
        "property_ids": ["uuid1", "uuid2"]
      }
    ],
    "selected_developers": ["dev-uuid1", "dev-uuid2"],
    "story_images": ["https://...", "https://..."],
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

### POST /api/mobile-home-data

Create or update mobile home page data.

**Request:** multipart/form-data

- `id` - (optional) ID for updating existing data
- `tagline_text` - String
- `properties_by_type` - JSON string
- `selected_developers` - JSON array string
- `video_file` - Video file (optional)
- `story_images` - Array of image files (optional)
- `existing_video_url` - String (optional)
- `existing_story_images` - JSON array string (optional)
- `story_images_to_delete` - JSON array string (optional)

**Response:**

```json
{
  "data": {
    // Same structure as GET response
  }
}
```

### DELETE /api/mobile-home-data?id={id}

Delete mobile home page data entry.

**Response:**

```json
{
  "message": "Mobile home data deleted successfully"
}
```

## Mobile App Integration

To fetch and display the home page data in your mobile app:

```javascript
// Example fetch in mobile app
const response = await fetch('YOUR_API_URL/api/mobile-home-data');
const { data } = await response.json();

// Structure of data:
{
  featuredVideo: data.featured_video_url,
  taglineText: data.tagline_text,
  properties: data.properties_by_type,
  developers: data.selected_developers,
  stories: data.story_images
}
```

## Data Structure Details

### properties_by_type

```json
[
  {
    "property_type_id": 1,
    "property_type_name": "Villa",
    "property_ids": ["uuid1", "uuid2", "uuid3"]
  },
  {
    "property_type_id": 2,
    "property_type_name": "Apartment",
    "property_ids": ["uuid4", "uuid5"]
  }
]
```

### selected_developers

```json
[
  {
    "id": "developer-uuid-1",
    "name": "Emaar Properties",
    "description": "Leading real estate developer",
    "image_url": "https://...",
    "is_active": true,
    "created_at": "2025-01-01T10:00:00.000Z",
    "updated_at": "2025-01-01T10:00:00.000Z"
  },
  {
    "id": "developer-uuid-2",
    "name": "Damac Properties",
    "description": "Luxury property developer",
    "image_url": "https://...",
    "is_active": true,
    "created_at": "2025-01-01T10:00:00.000Z",
    "updated_at": "2025-01-01T10:00:00.000Z"
  }
]
```

### story_images

```json
[
  "https://supabase.co/storage/v1/object/public/mobile-stories/image1.jpg",
  "https://supabase.co/storage/v1/object/public/mobile-stories/image2.jpg"
]
```

## File Size Limits

- **Videos:** 20MB maximum
- **Story Images:** 5MB maximum per image
- **Total Story Images:** 10 images maximum

## Troubleshooting

### Video Upload Fails

- Check file size is under 20MB
- Verify file format is MP4, MOV, AVI, or WebM
- Ensure `videos` bucket exists in Supabase

### Story Images Not Uploading

- Check each image is under 5MB
- Verify image format is JPG, PNG, WebP, or GIF
- Ensure `mobile-stories` bucket exists
- Check you haven't exceeded 10 images limit

### Data Not Saving

- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Ensure `mobile_home_data` table exists
- Check RLS policies are set correctly

### Bucket Creation Fails

- Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Check if buckets already exist in Supabase dashboard
- Ensure you have admin permissions

## Notes

- Only one active home page configuration exists at a time
- Previous configurations are automatically deactivated when creating new ones
- Deleted media files are automatically removed from storage
- All API calls require authentication

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
