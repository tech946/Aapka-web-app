# Property Images Upload Feature - Setup Guide

This guide will help you set up the image upload functionality for properties.

## What's Been Implemented

1. **Database**: Added `property_images` column to the properties table (TEXT[] array)
2. **Storage**: Configured to use a "properties" bucket in Supabase
3. **Frontend**:
   - Image selection with preview (up to 5 images per property)
   - Ability to add/remove images in both create and edit modes
   - Display existing images with delete functionality
4. **Backend API**:
   - Upload multiple images to Supabase storage
   - Delete images from storage when removed
   - Handle image management in create/edit/delete operations

## Setup Steps

### Step 1: Run Database Migration

Execute the SQL migration to add the `property_images` column:

```bash
# Navigate to the database folder
cd database

# Run the migration using psql or Supabase Dashboard
```

**SQL Script**: `database/properties_add_images_column.sql`

Or manually run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS property_images TEXT[] DEFAULT '{}';

COMMENT ON COLUMN properties.property_images IS 'Array of image URLs for the property (max 5 images)';

CREATE INDEX IF NOT EXISTS idx_properties_images ON properties USING GIN (property_images);
```

### Step 2: Create "properties" Storage Bucket in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Storage** section
3. Click **"New bucket"**
4. Enter bucket name: `properties`
5. Make it **PUBLIC** (so images can be displayed)
6. Click **"Create bucket"**

**Bucket Configuration:**

- Name: `properties`
- Public: Yes
- File size limit: 5MB per image
- Allowed MIME types: image/\* (all image types)

### Step 3: Set Up Storage Policies (Optional but Recommended)

Add RLS policies for the properties bucket:

**Policy 1: Allow Public Read**

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'properties');
```

**Policy 2: Allow Authenticated Insert**

```sql
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'properties' AND
  auth.role() = 'authenticated'
);
```

**Policy 3: Allow Authenticated Delete**

```sql
CREATE POLICY "Authenticated users can delete property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'properties' AND
  auth.role() = 'authenticated'
);
```

### Step 4: Test the Feature

1. Go to the Properties page in your dashboard
2. Click **"Add Property"**
3. Fill in the property details
4. Click **"Select Images"** under "Property Images"
5. Select up to 5 images from your computer
6. You should see image previews
7. Click **"Create"** to save

**For editing:**

1. Click **"Edit"** on any property
2. Existing images will be displayed
3. You can delete existing images by clicking the delete button
4. You can add new images (up to 5 total)
5. Click **"Update"** to save

## Features

### Image Limits

- Maximum 5 images per property
- Maximum 5MB per image
- Supported formats: All image types (jpg, png, gif, webp, etc.)

### Add Property Mode

- Select multiple images at once
- Preview images before upload
- Remove images before saving
- Images are only uploaded when you click "Create"

### Edit Property Mode

- View existing property images
- Delete existing images (removes from storage and database)
- Add new images (up to 5 total)
- Changes are saved when you click "Update"

### Delete Property

- When a property is deleted, all associated images are automatically deleted from storage

## File Structure

### Modified Files

1. **Frontend:**
   - `src/app/(dashboard)/dashboard/properties/page.tsx`
     - Added image state management
     - Added image upload UI
     - Added image preview and deletion

2. **Backend:**
   - `src/app/api/properties/route.ts`
     - POST: Upload new images to storage
     - PUT: Handle image updates (add new, delete old)
     - DELETE: Clean up images when property is deleted

3. **Database:**
   - `database/properties_add_images_column.sql`
     - Migration to add property_images column

## Troubleshooting

### Images not uploading

- Check if the "properties" bucket exists in Supabase Storage
- Verify bucket is set to PUBLIC
- Check browser console for errors
- Ensure file size is under 5MB

### Images not displaying

- Verify the bucket is PUBLIC
- Check if the image URLs are valid
- Open image URL directly in browser to test

### Permission errors

- Check RLS policies on the storage bucket
- Ensure user is authenticated
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in environment variables

## API Changes

### POST /api/properties

**New FormData Fields:**

- `property_images`: Array of File objects (up to 5)

### PUT /api/properties

**New FormData Fields:**

- `property_images`: Array of new File objects to upload
- `existing_images`: JSON string of existing image URLs to keep
- `images_to_delete`: JSON string of image URLs to delete

### Response Format

Properties now include:

```json
{
  "id": "...",
  "project_name": "...",
  "property_images": [
    "https://your-project.supabase.co/storage/v1/object/public/properties/...",
    "https://your-project.supabase.co/storage/v1/object/public/properties/..."
  ],
  ...
}
```

## Notes

- All existing functionality remains unchanged
- Images are stored in the `properties` bucket in Supabase Storage
- Image URLs are stored as an array in the `property_images` column
- The feature gracefully handles errors (e.g., if one image fails to upload, others still upload)
- Images are deleted from storage when removed or when property is deleted
