# Property Types CRUD with Image Upload - Final Setup

## ✅ What's Implemented

### **Consolidated API Approach**

- **Single API endpoint**: `/api/property-types` handles all CRUD operations + image uploads
- **Server-side image handling**: Images are processed directly in the API using Supabase Storage
- **No separate upload routes**: Everything is handled in one place for better maintainability

### **Image Upload Features**

- **Direct file upload**: Images are uploaded as part of the form submission
- **Automatic storage**: Files are stored in Supabase Storage bucket `property-type-images`
- **Image replacement**: When editing, old images are automatically deleted when new ones are uploaded
- **File validation**: Type (JPEG, PNG, WebP) and size (5MB max) validation
- **Preview functionality**: Images are previewed before submission

## 🚀 Setup Steps

### 1. Create Storage Bucket

In your Supabase Dashboard:

1. Go to **Storage**
2. Create a new bucket named `property-type-images`
3. Set it to **Public**
4. Set file size limit to **5MB**
5. Add allowed MIME types: `image/jpeg,image/jpg,image/png,image/webp`

### 2. Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ghsgnjzkgygiqmhjvtpi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Database Setup

Run the SQL script in `database/property_types_table.sql` in your Supabase SQL editor.

## 🔧 How It Works

### **Create Property Type**

- **With image**: Sends form data with file to `/api/property-types` (POST)
- **Without image**: Sends JSON data to `/api/property-types` (POST)
- **Server processes**: File upload, validation, storage, database insert

### **Update Property Type**

- **With new image**: Sends form data with file + old image URL
- **Without new image**: Sends JSON data with existing image URL
- **Server processes**: File upload (if new), old image deletion, database update

### **Delete Property Type**

- **Server processes**: Image deletion from storage, database record deletion

## 📁 File Structure

```
src/app/api/property-types/
└── route.ts                    # Single API endpoint for all operations

src/app/(dashboard)/dashboard/master/property-types/
└── page.tsx                   # UI component with image handling

database/
└── property_types_table.sql   # Database schema
```

## 🎯 Key Benefits

1. **Simplified Architecture**: One API endpoint handles everything
2. **Server-side Processing**: Images are processed securely on the server
3. **Automatic Cleanup**: Old images are automatically deleted when replaced
4. **Better Error Handling**: Centralized error handling and validation
5. **Type Safety**: Full TypeScript support throughout

## 🧪 Testing

1. **Navigate to**: `/dashboard/master/property-types`
2. **Create**: Add new property type with image
3. **Edit**: Update property type and change image
4. **Delete**: Remove property type (image will be deleted too)

## 🔍 Troubleshooting

### Common Issues:

1. **500 Error**: Check if storage bucket exists and is properly configured
2. **File Upload Fails**: Verify file type and size restrictions
3. **Image Not Displaying**: Check if bucket is public and URLs are correct

### Debug Steps:

1. Check browser console for client-side errors
2. Check server logs for API errors
3. Verify Supabase storage bucket configuration
4. Test with small images first (< 1MB)

## 🎉 Ready to Use!

The system is now fully integrated and ready for production use. All image handling is done server-side through the main API endpoint, providing a clean and maintainable solution.
