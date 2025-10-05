# Image Functionality Implementation Summary

## ✅ **Completed APIs**

### **Countries API** (`/api/countries/route.ts`)

- ✅ POST method handles image uploads
- ✅ PUT method handles image updates with cleanup
- ✅ DELETE method removes images from storage
- ✅ Uses `country-images` bucket

### **States API** (`/api/states/route.ts`)

- ✅ POST method handles image uploads
- ✅ PUT method handles image updates with cleanup
- ✅ DELETE method removes images from storage
- ✅ Uses `state-images` bucket

### **Property Types API** (`/api/property-types/route.ts`)

- ✅ Already completed with full image functionality
- ✅ Uses `property-type-images` bucket

## 🔄 **Remaining APIs to Complete**

### **Cities API** (`/api/cities/route.ts`)

- ✅ POST method - COMPLETED
- ❌ PUT method - needs image handling
- ❌ DELETE method - needs image cleanup
- Uses `city-images` bucket

### **Areas API** (`/api/areas/route.ts`)

- ❌ POST method - needs image handling
- ❌ PUT method - needs image handling
- ❌ DELETE method - needs image cleanup
- Uses `area-images` bucket

## 🗄️ **Database Schema Updates Needed**

Add `image_url` column to these tables:

```sql
-- Add image_url column to existing tables
ALTER TABLE countries ADD COLUMN image_url TEXT;
ALTER TABLE states ADD COLUMN image_url TEXT;
ALTER TABLE cities ADD COLUMN image_url TEXT;
ALTER TABLE areas ADD COLUMN image_url TEXT;
```

## 🪣 **Storage Buckets to Create**

Create these buckets in Supabase Dashboard:

1. `country-images` - for country images
2. `state-images` - for state images
3. `city-images` - for city images
4. `area-images` - for area images
5. `property-type-images` - already exists

## 🎨 **UI Updates Needed**

Update these pages to handle images:

1. `/dashboard/master/countries/page.tsx`
2. `/dashboard/master/states/page.tsx`
3. `/dashboard/master/cities/page.tsx`
4. `/dashboard/master/areas/page.tsx`

Each page needs:

- Image preview in table
- Image upload in modal
- File selection handling
- Form data submission

## 🔧 **Quick Implementation Steps**

### 1. Complete Cities API

- Update PUT method to handle images
- Update DELETE method to clean up images

### 2. Complete Areas API

- Update POST method to handle images
- Update PUT method to handle images
- Update DELETE method to clean up images

### 3. Update Database

- Add image_url columns to all tables

### 4. Create Storage Buckets

- Create all required buckets in Supabase

### 5. Update UI Components

- Add image handling to all master data pages

## 📋 **Pattern to Follow**

Each API should follow this pattern:

### POST Method

```typescript
// Handle multipart/form-data for file uploads
if (contentType?.includes('multipart/form-data')) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  // Upload to storage and get URL
}
// Insert with image_url
```

### PUT Method

```typescript
// Handle file upload if new file provided
// Delete old image if changed
// Update with new image_url
```

### DELETE Method

```typescript
// Get existing image_url
// Delete from storage
// Delete database record
```

## 🎯 **Current Status**

- **APIs**: 3/5 completed (60%)
- **Database**: Needs schema updates
- **Storage**: Needs bucket creation
- **UI**: Needs updates for all pages

The foundation is solid - just need to complete the remaining APIs and update the UI components!
