# Property Types CRUD Setup

This document outlines the setup process for the Property Types CRUD system with image handling capabilities.

## Features Implemented

✅ **Complete CRUD Operations**

- Create new property types with name, description, and image
- Read/List property types with pagination
- Update existing property types (with image change handling)
- Delete property types (with image cleanup)

✅ **Image Management**

- Upload images to Supabase Storage
- Image preview in the UI
- Automatic image deletion when property type is deleted
- Image replacement with old image cleanup
- Support for JPEG, PNG, and WebP formats
- 5MB file size limit

✅ **UI Components**

- Responsive table with pagination
- Modal forms for create/edit operations
- Image preview and upload functionality
- Statistics dashboard
- Navigation integration

## Database Setup

1. **Run the SQL script** in your Supabase database:

   ```sql
   -- Execute the contents of database/property_types_table.sql
   ```

2. **Create Storage Bucket** in Supabase Dashboard:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket named `property-type-images`
   - Set it to public if you want public access to images

## Environment Variables

Ensure these environment variables are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── property-types/
│   │       ├── route.ts              # Main CRUD API
│   │       └── upload/
│   │           └── route.ts          # Image upload API
│   └── (dashboard)/
│       └── dashboard/
│           └── master/
│               └── property-types/
│                   └── page.tsx      # UI Component
├── lib/
│   └── supabase-admin.ts            # Supabase admin client
└── database/
    └── property_types_table.sql     # Database schema
```

## API Endpoints

### Property Types CRUD

- `GET /api/property-types` - List property types with pagination
- `POST /api/property-types` - Create new property type
- `PUT /api/property-types` - Update existing property type
- `DELETE /api/property-types` - Delete property type

### Image Upload

- `POST /api/property-types/upload` - Upload image file
- `DELETE /api/property-types/upload` - Delete image file

## Usage

1. **Navigate to Property Types**: Go to `/dashboard/master/property-types`
2. **Add New Property Type**: Click "Add Property Type" button
3. **Upload Image**: Use the upload button in the modal to add an image
4. **Edit Property Type**: Click the edit icon in the table
5. **Change Image**: Upload a new image to replace the existing one
6. **Delete Property Type**: Click the delete icon (with confirmation)

## Image Handling Logic

- **On Create**: Image is uploaded to Supabase Storage and URL is stored in database
- **On Update**:
  - If image is the same, no changes are made
  - If image is different, old image is deleted and new one is uploaded
- **On Delete**: Associated image is automatically deleted from storage

## Security Features

- File type validation (JPEG, PNG, WebP only)
- File size validation (5MB max)
- Row Level Security (RLS) enabled
- Service role key for admin operations

## Navigation

The Property Types page is accessible through:

- Dashboard → Master Data → Property Types

## Dependencies

- Next.js 14
- Ant Design (UI components)
- Supabase (Database & Storage)
- Axios (HTTP client)

## Troubleshooting

1. **Image upload fails**: Check Supabase Storage bucket exists and is properly configured
2. **Database errors**: Ensure the table schema is created correctly
3. **Permission errors**: Verify RLS policies are set up correctly
4. **File upload errors**: Check file size and type restrictions
