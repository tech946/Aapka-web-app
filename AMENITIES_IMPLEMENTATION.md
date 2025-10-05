# Amenities CRUD Implementation

## Overview

Complete amenities management system with image functionality, following the same pattern as property-types.

## Files Created/Modified

### 1. Database Schema

- **File**: `database/amenities_table.sql`
- **Purpose**: Creates amenities table with image support
- **Features**:
  - UUID primary key
  - Name, description, image_url fields
  - RLS policies for service role access
  - Storage bucket for amenity images
  - Auto-updating timestamps

### 2. API Routes

- **File**: `src/app/api/amenities/route.ts`
- **Purpose**: Handles all CRUD operations for amenities
- **Features**:
  - GET: Paginated list with search
  - POST: Create amenity with optional image
  - PUT: Update amenity with image replacement
  - DELETE: Remove amenity and associated image
  - Image validation (type, size)
  - Supabase Storage integration

### 3. Frontend Page

- **File**: `src/app/(dashboard)/dashboard/master/amenities/page.tsx`
- **Purpose**: User interface for managing amenities
- **Features**:
  - Data table with pagination
  - Add/Edit modal with form validation
  - Image upload with preview
  - Image removal functionality
  - Statistics display
  - Responsive design

### 4. Navigation

- **File**: `src/app/(dashboard)/dashboard/master/layout.tsx`
- **Purpose**: Added amenities menu item
- **Features**:
  - New menu item with SettingOutlined icon
  - Proper routing to amenities page

## Key Features

### Image Management

- Upload images during creation
- Preview images in table and modal
- Replace images during editing
- Automatic cleanup of old images
- Image validation (type: JPEG/PNG/WebP, size: max 5MB)

### CRUD Operations

- **Create**: Add new amenities with optional images
- **Read**: Paginated list with search and sorting
- **Update**: Edit amenity details and replace images
- **Delete**: Remove amenities and clean up images

### User Experience

- Responsive table with image thumbnails
- Form validation with helpful error messages
- Loading states and success notifications
- Pagination with customizable page sizes
- Statistics dashboard

## API Endpoints

### GET /api/amenities

- **Query Parameters**: `page`, `limit`
- **Response**: Paginated list of amenities
- **Example**: `/api/amenities?page=1&limit=10`

### POST /api/amenities

- **Content-Type**: `multipart/form-data` (with image) or `application/json`
- **Body**: `name`, `description`, `image_file` (optional)
- **Response**: Created amenity object

### PUT /api/amenities

- **Content-Type**: `multipart/form-data` (with image) or `application/json`
- **Body**: `id`, `name`, `description`, `image_file` (optional), `existing_image_url`
- **Response**: Updated amenity object

### DELETE /api/amenities

- **Query Parameters**: `id`
- **Response**: Success message

## Database Structure

```sql
CREATE TABLE amenities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Storage Configuration

- **Bucket**: `amenity-images`
- **Public Access**: Yes (for image display)
- **File Naming**: Timestamp + random string
- **Supported Formats**: JPEG, PNG, WebP
- **Max File Size**: 5MB

## Usage Instructions

1. **Run Database Migration**: Execute `database/amenities_table.sql` in Supabase
2. **Access Page**: Navigate to `/dashboard/master/amenities`
3. **Add Amenity**: Click "Add Amenity" button
4. **Upload Image**: Use the upload button in the modal
5. **Edit Amenity**: Click edit button on any row
6. **Delete Amenity**: Click delete button (with confirmation)

## Error Handling

- Form validation for required fields
- Image type and size validation
- API error messages displayed to user
- Graceful handling of network errors
- Automatic cleanup on failed operations

## Security

- RLS policies for database access
- Service role authentication for API operations
- Image validation to prevent malicious uploads
- Proper error handling without exposing sensitive data
