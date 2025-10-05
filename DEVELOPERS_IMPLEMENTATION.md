# Developers CRUD Implementation

## Overview

Complete developer management system with image functionality and country reference, designed for managing property developers with their contact information and country association.

## Files Created/Modified

### 1. Database Schema

- **File**: `database/developers_table.sql`
- **Purpose**: Creates developers table with image support and country reference
- **Features**:
  - UUID primary key
  - Name, description, email, phone, website, address fields
  - Country reference (foreign key to countries table)
  - Image URL for developer photos
  - Active/inactive status
  - RLS policies for service role access
  - Storage bucket for developer images
  - Auto-updating timestamps

### 2. API Routes

- **File**: `src/app/api/developers/route.ts`
- **Purpose**: Handles all CRUD operations for developers
- **Features**:
  - GET: Paginated list with country information
  - POST: Create developer with optional image
  - PUT: Update developer with image replacement
  - DELETE: Remove developer and associated image
  - Image validation (type, size)
  - Supabase Storage integration
  - Country relationship handling

### 3. Frontend Page

- **File**: `src/app/(dashboard)/dashboard/master/developers/page.tsx`
- **Purpose**: User interface for managing developers
- **Features**:
  - Data table with pagination
    - Developer photo thumbnails
    - Contact information display
    - Country information
    - Status indicators
  - Add/Edit modal with comprehensive form
    - Image upload with preview
    - Country dropdown with search
    - Contact information fields
    - Status toggle
  - Statistics display
  - Responsive design

### 4. Navigation

- **File**: `src/app/(dashboard)/dashboard/master/layout.tsx`
- **Purpose**: Added developers menu item
- **Features**:
  - New menu item with TeamOutlined icon
  - Proper routing to developers page

## Key Features

### Image Management

- Upload developer photos during creation
- Preview images in table and modal
- Replace images during editing
- Automatic cleanup of old images
- Image validation (type: JPEG/PNG/WebP, size: max 5MB)

### Country Integration

- Foreign key relationship with countries table
- Country dropdown with search functionality
- Country information displayed in table
- Optional country selection

### Contact Information

- Email with validation
- Phone number
- Website URL
- Physical address
- All fields are optional

### CRUD Operations

- **Create**: Add new developers with optional images and country
- **Read**: Paginated list with country information
- **Update**: Edit developer details and replace images
- **Delete**: Remove developers and clean up images

### User Experience

- Responsive table with developer photos
- Form validation with helpful error messages
- Loading states and success notifications
- Pagination with customizable page sizes
- Statistics dashboard
- Search functionality in country dropdown

## API Endpoints

### GET /api/developers

- **Query Parameters**: `page`, `limit`
- **Response**: Paginated list of developers with country information
- **Example**: `/api/developers?page=1&limit=10`

### POST /api/developers

- **Content-Type**: `multipart/form-data` (with image) or `application/json`
- **Body**: `name`, `description`, `email`, `phone`, `website`, `address`, `country_id`, `is_active`, `image_file` (optional)
- **Response**: Created developer object with country information

### PUT /api/developers

- **Content-Type**: `multipart/form-data` (with image) or `application/json`
- **Body**: `id`, `name`, `description`, `email`, `phone`, `website`, `address`, `country_id`, `is_active`, `image_file` (optional), `existing_image_url`
- **Response**: Updated developer object with country information

### DELETE /api/developers

- **Query Parameters**: `id`
- **Response**: Success message

## Database Structure

```sql
CREATE TABLE developers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  address TEXT,
  country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Storage Configuration

- **Bucket**: `developer-images`
- **Public Access**: Yes (for image display)
- **File Naming**: Timestamp + random string
- **Supported Formats**: JPEG, PNG, WebP
- **Max File Size**: 5MB

## Usage Instructions

1. **Run Database Migration**: Execute `database/developers_table.sql` in Supabase
2. **Access Page**: Navigate to `/dashboard/master/developers`
3. **Add Developer**: Click "Add Developer" button
4. **Upload Photo**: Use the upload button in the modal
5. **Select Country**: Choose from the country dropdown
6. **Fill Details**: Enter contact information and description
7. **Edit Developer**: Click edit button on any row
8. **Delete Developer**: Click delete button (with confirmation)

## Form Fields

### Required Fields

- **Name**: Developer name (minimum 2 characters)

### Optional Fields

- **Description**: Detailed description of the developer
- **Email**: Contact email (validated format)
- **Phone**: Contact phone number
- **Website**: Developer website URL
- **Address**: Physical address
- **Country**: Associated country (dropdown selection)
- **Image**: Developer photo
- **Status**: Active/Inactive toggle

## Error Handling

- Form validation for required fields
- Email format validation
- Image type and size validation
- API error messages displayed to user
- Graceful handling of network errors
- Automatic cleanup on failed operations

## Security

- RLS policies for database access
- Service role authentication for API operations
- Image validation to prevent malicious uploads
- Proper error handling without exposing sensitive data
- Input validation and sanitization

## Country Integration

- Foreign key relationship with countries table
- Cascading delete set to NULL (preserves developer if country deleted)
- Country information included in API responses
- Searchable country dropdown in frontend
- Country display in table with icon

## Image Features

- Developer photo thumbnails in table
- Image preview in modal
- Image replacement during editing
- Automatic cleanup of old images
- Fallback image for missing photos
- Responsive image sizing
